// Admin surface for AI Prompt Genius: a self-contained dashboard (users + storage) and CRUD for
// promotions, plus the public /promos endpoint the extension polls. Kept out of index.ts so the
// hot /sync path stays lean.
//
// Auth: every /admin/api/* call requires `Authorization: Bearer <ADMIN_TOKEN>` (a wrangler
// secret). The /admin HTML shell is public but inert without the token, which the page prompts
// for and stores in localStorage. The public /promos endpoint needs no auth.

export interface AdminEnv {
    DB: D1Database
    WORKOS_CLIENT_ID: string
    WORKOS_API_KEY?: string
    ADMIN_TOKEN?: string
}

const WORKOS = "https://api.workos.com"

function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "content-type, authorization",
            "access-control-allow-methods": "GET, POST, OPTIONS",
        },
    })
}

// Constant-ish bearer check. `ADMIN_TOKEN` must be set (a missing secret never authorizes).
function isAdmin(req: Request, env: AdminEnv): boolean {
    const header = req.headers.get("authorization") ?? ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : ""
    return !!env.ADMIN_TOKEN && token.length === env.ADMIN_TOKEN.length && token === env.ADMIN_TOKEN
}

// Pull every WorkOS user (paginated) → id → { email, createdAt }. Best-effort: a missing API
// key or an API hiccup just yields no emails, and the dashboard falls back to raw user ids.
async function listWorkosUsers(
    env: AdminEnv,
): Promise<Map<string, { email: string; createdAt?: string }>> {
    const map = new Map<string, { email: string; createdAt?: string }>()
    if (!env.WORKOS_API_KEY) return map
    let after: string | undefined
    // Bounded loop guard in case list_metadata ever loops.
    for (let page = 0; page < 100; page++) {
        const u = new URL(`${WORKOS}/user_management/users`)
        u.searchParams.set("limit", "100")
        if (after) u.searchParams.set("after", after)
        const res = await fetch(u.toString(), {
            headers: { authorization: `Bearer ${env.WORKOS_API_KEY}` },
        })
        if (!res.ok) break
        const data = (await res.json()) as {
            data?: Array<{ id: string; email: string; created_at?: string }>
            list_metadata?: { after?: string | null }
        }
        for (const usr of data.data ?? []) {
            map.set(usr.id, { email: usr.email, createdAt: usr.created_at })
        }
        after = data.list_metadata?.after ?? undefined
        if (!after) break
    }
    return map
}

// Active promos whose date window includes today (D1's date('now') is UTC). Shared by the
// admin preview and the public endpoint.
async function activePromos(env: AdminEnv): Promise<Array<{ id: string; name: string; url: string }>> {
    const rows = await env.DB.prepare(
        `SELECT id, name, url FROM promos
         WHERE active = 1 AND date('now') BETWEEN start_date AND end_date
         ORDER BY created_at`,
    ).all()
    return (rows.results ?? []) as Array<{ id: string; name: string; url: string }>
}

// Public: the extension polls this. No auth; only exposes id/name/url of live promos.
export async function handlePublicPromos(env: AdminEnv): Promise<Response> {
    try {
        return json({ promos: await activePromos(env) })
    } catch {
        return json({ promos: [] })
    }
}

export async function handleAdmin(req: Request, env: AdminEnv, pathname: string): Promise<Response> {
    if (pathname === "/admin" && req.method === "GET") {
        return new Response(ADMIN_HTML, {
            headers: { "content-type": "text/html; charset=utf-8" },
        })
    }

    if (!pathname.startsWith("/admin/api/")) return json({ error: "not found" }, 404)
    if (!isAdmin(req, env)) return json({ error: "unauthorized" }, 401)

    // Users + storage aggregate.
    if (pathname === "/admin/api/users" && req.method === "GET") {
        const agg = await env.DB.prepare(
            `SELECT user_id AS userId, COUNT(*) AS prompts,
                    COALESCE(SUM(
                      LENGTH(COALESCE(text,'')) + LENGTH(COALESCE(title,'')) +
                      LENGTH(COALESCE(description,'')) + LENGTH(COALESCE(tags,''))
                    ), 0) AS storageBytes
             FROM prompts WHERE deleted_at IS NULL GROUP BY user_id`,
        ).all()

        const byId = new Map<string, { userId: string; email: string; prompts: number; storageBytes: number }>()
        for (const r of (agg.results ?? []) as Array<{ userId: string; prompts: number; storageBytes: number }>) {
            byId.set(r.userId, { userId: r.userId, email: "", prompts: r.prompts, storageBytes: r.storageBytes })
        }
        // Union in WorkOS users (some may have no prompts yet → 0 storage).
        const workos = await listWorkosUsers(env)
        for (const [id, info] of workos) {
            const existing = byId.get(id)
            if (existing) existing.email = info.email
            else byId.set(id, { userId: id, email: info.email, prompts: 0, storageBytes: 0 })
        }

        const users = [...byId.values()].sort((a, b) => b.storageBytes - a.storageBytes)
        return json({ users })
    }

    if (pathname === "/admin/api/promos" && req.method === "GET") {
        const rows = await env.DB.prepare(
            "SELECT id, name, url, start_date, end_date, active, created_at FROM promos ORDER BY created_at DESC",
        ).all()
        return json({ promos: rows.results ?? [] })
    }

    if (pathname === "/admin/api/promos" && req.method === "POST") {
        const b = (await req.json().catch(() => ({}))) as {
            id?: string
            name?: string
            url?: string
            start_date?: string
            end_date?: string
            active?: boolean | number
        }
        if (!b.name || !b.url || !b.start_date || !b.end_date) {
            return json({ error: "name, url, start_date and end_date are required" }, 400)
        }
        const id = b.id || crypto.randomUUID()
        await env.DB.prepare(
            `INSERT INTO promos (id, name, url, start_date, end_date, active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               name=excluded.name, url=excluded.url, start_date=excluded.start_date,
               end_date=excluded.end_date, active=excluded.active`,
        )
            .bind(id, b.name, b.url, b.start_date, b.end_date, b.active ? 1 : 0, Date.now())
            .run()
        return json({ ok: true, id })
    }

    if (pathname === "/admin/api/promos/delete" && req.method === "POST") {
        const b = (await req.json().catch(() => ({}))) as { id?: string }
        if (!b.id) return json({ error: "id required" }, 400)
        await env.DB.prepare("DELETE FROM promos WHERE id = ?").bind(b.id).run()
        return json({ ok: true })
    }

    return json({ error: "not found" }, 404)
}

// ── Self-contained dashboard (inline CSS + JS, no build step, no external deps) ────────────────
const ADMIN_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>AI Prompt Genius — Admin</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #0f1115; color: #e6e8eb; }
  header { padding: 20px 24px; border-bottom: 1px solid #23262e; display: flex; align-items: center;
    justify-content: space-between; gap: 16px; }
  h1 { font-size: 18px; margin: 0; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .06em; color: #9aa0ac; margin: 0 0 12px; }
  main { max-width: 1000px; margin: 0 auto; padding: 24px; }
  section { margin-bottom: 40px; }
  .muted { color: #9aa0ac; }
  table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #23262e; }
  th { color: #9aa0ac; font-weight: 600; font-size: 13px; }
  td.num, th.num { text-align: right; }
  tfoot td { font-weight: 700; border-top: 2px solid #33384a; }
  input, button { font: inherit; }
  input { background: #1a1d24; border: 1px solid #2b2f3a; color: #e6e8eb; border-radius: 8px;
    padding: 8px 10px; }
  button { background: #3b82f6; border: 0; color: #fff; border-radius: 8px; padding: 8px 14px;
    cursor: pointer; }
  button.ghost { background: transparent; border: 1px solid #2b2f3a; color: #e6e8eb; }
  button.danger { background: transparent; border: 1px solid #5b2b2b; color: #f2a3a3; }
  .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .card { background: #14171d; border: 1px solid #23262e; border-radius: 12px; padding: 16px; }
  .grid { display: grid; grid-template-columns: 1fr 2fr 130px 130px 70px auto; gap: 8px; align-items: center; }
  .pill { font-size: 12px; padding: 2px 8px; border-radius: 999px; }
  .pill.on { background: #14361f; color: #7fd99a; }
  .pill.off { background: #2a2d34; color: #9aa0ac; }
  .stat { font-size: 26px; font-weight: 700; }
  #gate { max-width: 420px; margin: 80px auto; }
  .hidden { display: none; }
</style>
</head>
<body>
<header>
  <h1>AI Prompt Genius — Admin</h1>
  <button id="signout" class="ghost hidden">Sign out</button>
</header>

<div id="gate" class="card">
  <h2>Admin token</h2>
  <p class="muted">Enter the admin token (set via <code>wrangler secret put ADMIN_TOKEN</code>).</p>
  <div class="row">
    <input id="token" type="password" placeholder="Admin token" style="flex:1" />
    <button id="enter">Enter</button>
  </div>
  <p id="gateErr" class="muted"></p>
</div>

<main id="app" class="hidden">
  <section>
    <h2>Users &amp; storage</h2>
    <div class="row" style="justify-content:space-between; margin-bottom:12px">
      <span class="muted">Storage is approximate — the character length of each prompt's fields.</span>
      <button id="reload" class="ghost">Reload</button>
    </div>
    <table id="usersTable">
      <thead><tr>
        <th>User</th><th class="num"># Prompts</th><th class="num">Total storage</th>
      </tr></thead>
      <tbody></tbody>
      <tfoot></tfoot>
    </table>
  </section>

  <section>
    <h2>Promotions</h2>
    <div id="promos"></div>
    <div class="card" style="margin-top:16px">
      <h2>Add / edit promo</h2>
      <div class="grid" style="grid-template-columns:1fr; gap:10px">
        <input id="p_name" placeholder="Name (label)" />
        <input id="p_url" placeholder="https://… (tab to open)" />
        <div class="row">
          <label class="muted">Start <input id="p_start" type="date" /></label>
          <label class="muted">End <input id="p_end" type="date" /></label>
          <label class="row" style="gap:6px"><input id="p_active" type="checkbox" checked /> Active</label>
        </div>
        <div class="row">
          <button id="p_save">Save promo</button>
          <button id="p_clear" class="ghost">Clear form</button>
          <input id="p_id" type="hidden" />
        </div>
      </div>
    </div>
  </section>
</main>

<script>
  var token = localStorage.getItem("apg_admin_token") || "";
  var gate = document.getElementById("gate");
  var app = document.getElementById("app");

  function fmtBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / 1024 / 1024).toFixed(2) + " MB";
  }
  async function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ authorization: "Bearer " + token }, opts.headers || {});
    var res = await fetch(path, opts);
    if (res.status === 401) throw new Error("unauthorized");
    return res.json();
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  async function loadUsers() {
    var data = await api("/admin/api/users");
    var tb = document.querySelector("#usersTable tbody");
    var tf = document.querySelector("#usersTable tfoot");
    tb.innerHTML = "";
    var totalBytes = 0, totalPrompts = 0;
    (data.users || []).forEach(function (u) {
      totalBytes += u.storageBytes; totalPrompts += u.prompts;
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>" + esc(u.email || u.userId) + "</td>" +
        "<td class='num'>" + u.prompts + "</td>" +
        "<td class='num'>" + fmtBytes(u.storageBytes) + "</td>";
      tb.appendChild(tr);
    });
    tf.innerHTML = "<tr><td>" + (data.users || []).length + " users</td>" +
      "<td class='num'>" + totalPrompts + "</td>" +
      "<td class='num'>" + fmtBytes(totalBytes) + "</td></tr>";
  }

  async function loadPromos() {
    var data = await api("/admin/api/promos");
    var box = document.getElementById("promos");
    box.innerHTML = "";
    (data.promos || []).forEach(function (p) {
      var el = document.createElement("div");
      el.className = "card";
      el.style.marginBottom = "8px";
      el.innerHTML =
        "<div class='row' style='justify-content:space-between'>" +
          "<div><strong>" + esc(p.name) + "</strong> " +
            "<span class='pill " + (p.active ? "on" : "off") + "'>" + (p.active ? "active" : "off") + "</span>" +
            "<div class='muted' style='font-size:13px'>" + esc(p.url) + "</div>" +
            "<div class='muted' style='font-size:13px'>" + esc(p.start_date) + " → " + esc(p.end_date) + "</div>" +
          "</div>" +
          "<div class='row'><button class='ghost' data-edit>Edit</button>" +
          "<button class='danger' data-del>Delete</button></div>" +
        "</div>";
      el.querySelector("[data-edit]").onclick = function () {
        document.getElementById("p_id").value = p.id;
        document.getElementById("p_name").value = p.name;
        document.getElementById("p_url").value = p.url;
        document.getElementById("p_start").value = p.start_date;
        document.getElementById("p_end").value = p.end_date;
        document.getElementById("p_active").checked = !!p.active;
        window.scrollTo(0, document.body.scrollHeight);
      };
      el.querySelector("[data-del]").onclick = async function () {
        if (!confirm("Delete promo '" + p.name + "'?")) return;
        await api("/admin/api/promos/delete", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: p.id }),
        });
        loadPromos();
      };
      box.appendChild(el);
    });
    if (!(data.promos || []).length) box.innerHTML = "<p class='muted'>No promos yet.</p>";
  }

  function clearForm() {
    ["p_id", "p_name", "p_url", "p_start", "p_end"].forEach(function (id) {
      document.getElementById(id).value = "";
    });
    document.getElementById("p_active").checked = true;
  }

  document.getElementById("p_save").onclick = async function () {
    var payload = {
      id: document.getElementById("p_id").value || undefined,
      name: document.getElementById("p_name").value.trim(),
      url: document.getElementById("p_url").value.trim(),
      start_date: document.getElementById("p_start").value,
      end_date: document.getElementById("p_end").value,
      active: document.getElementById("p_active").checked,
    };
    if (!payload.name || !payload.url || !payload.start_date || !payload.end_date) {
      alert("Name, URL, start and end dates are all required."); return;
    }
    var res = await api("/admin/api/promos", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.error) { alert(res.error); return; }
    clearForm();
    loadPromos();
  };
  document.getElementById("p_clear").onclick = clearForm;
  document.getElementById("reload").onclick = function () { loadUsers(); };

  async function boot() {
    gate.classList.add("hidden");
    app.classList.remove("hidden");
    document.getElementById("signout").classList.remove("hidden");
    try { await loadUsers(); await loadPromos(); }
    catch (e) { signOut(); document.getElementById("gateErr").textContent = "Invalid token."; }
  }
  function signOut() {
    token = ""; localStorage.removeItem("apg_admin_token");
    app.classList.add("hidden");
    document.getElementById("signout").classList.add("hidden");
    gate.classList.remove("hidden");
  }
  document.getElementById("enter").onclick = function () {
    token = document.getElementById("token").value.trim();
    localStorage.setItem("apg_admin_token", token);
    boot();
  };
  document.getElementById("token").addEventListener("keydown", function (e) {
    if (e.key === "Enter") document.getElementById("enter").click();
  });
  document.getElementById("signout").onclick = signOut;

  if (token) boot();
</script>
</body>
</html>`
