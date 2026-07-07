import i18next from "i18next"
import { getObject, setObject, sendMessageToParent } from "../components/js/utils"
import { updateProStatus } from "../components/js/pro"

// Account-level settings + Pro license sync (rides on the /sync request in syncClient.ts).
//
// Settings are a small device-portable blob — language, theme, persist_variables — merged
// last-writer-wins against the account. The Pro license key syncs too so Pro follows the account
// across every signed-in device rather than being re-activated per device.
//
// `theme` and `persist_variables` are kept in their raw localStorage encodings (the theme value is
// JSON-encoded by @uidotdev/usehooks' useLocalStorage, e.g. `"winter"`), so applying a pulled value
// is a verbatim write-back — no re-encoding to get wrong.

export interface SettingsPayload {
    data: Record<string, unknown>
    updatedAt: number
}

const SETTINGS_SYNCED_KEY = "cf_settings_synced" // last blob the server acknowledged (baseline)
const SETTINGS_TS_KEY = "cf_settings_updated_at" // our last-known winning timestamp

const SYNCED_KEYS = ["lng", "theme", "persist_variables"] as const

/** Snapshot the syncable settings from localStorage in their raw stored form. */
function buildSettingsSnapshot(): Record<string, string> {
    const snap: Record<string, string> = {}
    for (const key of SYNCED_KEYS) {
        const v = localStorage.getItem(key)
        if (v !== null) snap[key] = v
    }
    return snap
}

/**
 * The settings blob to push. We bump `updatedAt` to now only when the local snapshot has drifted
 * from the last-synced baseline, so an unchanged device doesn't keep winning the merge.
 */
export function getSettingsPush(): SettingsPayload {
    const data = buildSettingsSnapshot()
    const baseline = getObject(SETTINGS_SYNCED_KEY, null) as Record<string, string> | null
    let updatedAt = Number(localStorage.getItem(SETTINGS_TS_KEY) ?? 0)
    if (!baseline || JSON.stringify(baseline) !== JSON.stringify(data)) {
        updatedAt = Date.now()
    }
    return { data, updatedAt }
}

/** The Pro license key to push, or `undefined` to leave the account's key untouched. */
export function getProKeyPush(): string | undefined {
    return localStorage.getItem("pro_key") ?? undefined
}

/** Apply the server's winning settings blob and record it as the new baseline. */
export function applyPulledSettings(pulled: SettingsPayload | undefined): void {
    if (!pulled) return
    const localTs = Number(localStorage.getItem(SETTINGS_TS_KEY) ?? 0)

    if (pulled.updatedAt > localTs) {
        const d = pulled.data
        for (const key of SYNCED_KEYS) {
            if (typeof d[key] === "string") localStorage.setItem(key, d[key] as string)
        }
        if (typeof d.lng === "string") i18next.changeLanguage(d.lng)
        // usehooks' useLocalStorage re-reads on this event, so the theme updates live in-tab.
        window.dispatchEvent(new StorageEvent("local-storage"))
    }

    localStorage.setItem(SETTINGS_TS_KEY, String(pulled.updatedAt))
    setObject(SETTINGS_SYNCED_KEY, pulled.data)
}

/** Apply the account's Pro license key, activating Pro locally and reconciling against Gumroad. */
export function applyPulledProKey(proKey: string | null | undefined): void {
    if (!proKey) return
    if (proKey === localStorage.getItem("pro_key")) return
    localStorage.setItem("pro_key", proKey)
    localStorage.setItem("pro", "true")
    sendMessageToParent({ message: "pro_status", pro: true })
    // Verify (non-incrementing) so a revoked/expired key self-corrects instead of granting Pro forever.
    updateProStatus()
}
