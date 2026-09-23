// Full account deletion, shared by the self-serve endpoint (/auth/delete-account) and the admin
// dashboard (/admin/api/users/delete). Purges every D1 row the user owns and deletes their WorkOS
// user so the login is gone too — this is a hard, irreversible delete, not a tombstone.

const WORKOS = "https://api.workos.com"

export interface DeleteEnv {
    DB: D1Database
    WORKOS_API_KEY?: string
}

// Purge all of a user's data from D1 in one transaction, then delete their WorkOS account. The
// WorkOS call is best-effort so the D1 purge still completes if the account API hiccups.
export async function deleteUserAccount(env: DeleteEnv, userId: string): Promise<void> {
    await env.DB.batch([
        env.DB.prepare("DELETE FROM prompts WHERE user_id = ?").bind(userId),
        env.DB.prepare("DELETE FROM folders WHERE user_id = ?").bind(userId),
        env.DB.prepare("DELETE FROM user_settings WHERE user_id = ?").bind(userId),
        env.DB.prepare("DELETE FROM mcp_mutations WHERE user_id = ?").bind(userId),
        env.DB.prepare("DELETE FROM sync_state WHERE user_id = ?").bind(userId),
    ])
    if (env.WORKOS_API_KEY) {
        await fetch(`${WORKOS}/user_management/users/${userId}`, {
            method: "DELETE",
            headers: { authorization: `Bearer ${env.WORKOS_API_KEY}` },
        })
    }
}
