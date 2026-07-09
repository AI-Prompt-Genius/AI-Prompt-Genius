// Full account deletion, shared by the self-serve endpoint (/auth/delete-account) and the admin
// dashboard (/admin/api/users/delete). Purges every D1 row the user owns and deletes their WorkOS
// user so the login is gone too — this is a hard, irreversible delete, not a tombstone.

const WORKOS = "https://api.workos.com"

export interface DeleteEnv {
    DB: D1Database
    WORKOS_API_KEY?: string
}

// Purge all of a user's data from D1 and delete their WorkOS account. D1 deletes run first (and
// unconditionally); the WorkOS call is best-effort so a purge still completes if the account API
// hiccups. `user_settings` is wrapped in its own try/catch because a not-yet-migrated DB has no
// such table (see migration 0003).
export async function deleteUserAccount(env: DeleteEnv, userId: string): Promise<void> {
    await env.DB.prepare("DELETE FROM prompts WHERE user_id = ?").bind(userId).run()
    await env.DB.prepare("DELETE FROM folders WHERE user_id = ?").bind(userId).run()
    try {
        await env.DB.prepare("DELETE FROM user_settings WHERE user_id = ?").bind(userId).run()
    } catch (err) {
        console.error("user_settings delete skipped", err)
    }
    if (env.WORKOS_API_KEY) {
        await fetch(`${WORKOS}/user_management/users/${userId}`, {
            method: "DELETE",
            headers: { authorization: `Bearer ${env.WORKOS_API_KEY}` },
        })
    }
}
