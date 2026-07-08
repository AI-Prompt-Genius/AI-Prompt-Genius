// Promotions are now managed from the admin dashboard and polled from the sync worker instead
// of being hardcoded and shipped in each release. The worker only returns promos that are
// active AND inside their date window, so the client just has to de-dupe against seenPromos.
const PROMO_ENDPOINT = "https://aipromptgenius-sync.aipromptgenius.workers.dev/promos"
const PROMO_ALARM = "promo-poll"
const PROMO_POLL_MINUTES = 360 // every 6 hours

// Poll the worker and open any live promo the user hasn't seen yet — once each. Pro users and
// fresh installs are skipped (an install shouldn't greet a new user with an ad).
async function checkPromos() {
    const { pro } = await chrome.storage.local.get({ pro: false })
    if (pro) return

    let promos
    try {
        const res = await fetch(PROMO_ENDPOINT, { cache: "no-store" })
        if (!res.ok) return
        promos = (await res.json()).promos
    } catch (err) {
        console.error("promo poll failed", err)
        return
    }
    if (!Array.isArray(promos) || promos.length === 0) return

    const { seenPromos } = await chrome.storage.local.get({ seenPromos: [] })
    const seen = new Set(seenPromos)
    let changed = false
    for (const promo of promos) {
        if (!promo || !promo.id || !promo.url || seen.has(promo.id)) continue
        chrome.tabs.create({ url: promo.url, active: true })
        seen.add(promo.id)
        changed = true
    }
    if (changed) await chrome.storage.local.set({ seenPromos: [...seen] })
}

// Poll on a recurring alarm plus on browser startup, so it isn't gated to extension updates.
chrome.alarms.create(PROMO_ALARM, { periodInMinutes: PROMO_POLL_MINUTES })
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === PROMO_ALARM) checkPromos()
})
chrome.runtime.onStartup.addListener(() => checkPromos())

// The toolbar icon now opens the popup (action.default_popup) instead of the
// side panel. The side panel is still reachable via the open-sidebar command.
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(err => console.error(err))

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.tabs.create({ url: chrome.runtime.getURL("pages/onboarding.html") })
    } else if (details.reason === "update") {
        console.log(details.previousVersion)
        // Get the first character of the previous version string
        const firstChar = details.previousVersion.charAt(0)
        // Check if the first character is 3, 2, or 1
        if (firstChar === "3" || firstChar === "2" || firstChar === "1") {
            chrome.tabs.create({ url: chrome.runtime.getURL("pages/transfer.html") })
        }
        // Also poll for promos on update (in addition to the recurring alarm).
        checkPromos()
    }
    chrome.runtime.setUninstallURL("https://link.aipromptgenius.app/general-uninstall")
})

chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "open-sidebar") {
        const chromeVersion = (/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1]
        if (chromeVersion >= 116) {
            chrome.sidePanel.open({ windowId: tab.windowId })
        }
    }
    if (command === "launch-search") {
        console.log("LAUNCHING SEARCH")
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["scripts/hotkey.js"],
        })
    }
})
