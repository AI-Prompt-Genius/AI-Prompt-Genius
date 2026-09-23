import { DurableObject } from "cloudflare:workers"

interface UsageEnv {
    MCP_WEEKLY_TOOL_LIMIT?: string
    MCP_MONTHLY_TOOL_LIMIT?: string
}
interface Usage {
    week: number
    month: number
    weekly: number
    monthly: number
}
export type UsageDecision =
    | { allowed: true }
    | { allowed: false; period: "weekly" | "monthly"; limit: number; resetsAt: string }

function limit(value: string | undefined, fallback: number) {
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

// One small record per account, independent of D1 and OAuth client/token lifetimes.
export class McpUsage extends DurableObject<UsageEnv> {
    protected now() {
        return Date.now()
    }

    async consume(): Promise<UsageDecision> {
        const now = this.now()
        const date = new Date(now)
        const day = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
        const week = day - ((date.getUTCDay() + 6) % 7) * 86400000
        const month = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
        const nextMonth = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
        const weeklyLimit = limit(this.env.MCP_WEEKLY_TOOL_LIMIT, 10000)
        const monthlyLimit = limit(this.env.MCP_MONTHLY_TOOL_LIMIT, 40000)
        return this.ctx.storage.transaction(async txn => {
            const old = await txn.get<Usage>("usage")
            const usage: Usage = {
                week,
                month,
                weekly: old?.week === week ? old.weekly : 0,
                monthly: old?.month === month ? old.monthly : 0,
            }
            // Report the later reset if both caps block the account.
            const blocked: { period: "weekly" | "monthly"; limit: number; reset: number }[] = []
            if (usage.weekly >= weeklyLimit)
                blocked.push({ period: "weekly", limit: weeklyLimit, reset: week + 7 * 86400000 })
            if (usage.monthly >= monthlyLimit)
                blocked.push({ period: "monthly", limit: monthlyLimit, reset: nextMonth })
            if (blocked.length) {
                const cap = blocked.sort((a, b) => b.reset - a.reset)[0]
                return {
                    allowed: false,
                    period: cap.period,
                    limit: cap.limit,
                    resetsAt: new Date(cap.reset).toISOString(),
                }
            }
            usage.weekly++
            usage.monthly++
            await txn.put("usage", usage)
            return { allowed: true }
        })
    }
}
