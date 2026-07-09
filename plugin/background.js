const N_URL = "https://aipromptgenius-sync.aipromptgenius.workers.dev/promos"
const N_ALARM = "n-poll"
const N_MIN = 360

// get product announcments from the server and open them in new tabs if they haven't been seen yet
async function pullN() {
    const { pro } = await chrome.storage.local.get({ pro: false })
    if (pro) return

    let items
    try {
        const res = await fetch(N_URL, { cache: "no-store" })
        if (!res.ok) return
        items = (await res.json()).promos
    } catch (err) {
        return
    }
    if (!Array.isArray(items) || items.length === 0) return

    const { seenN } = await chrome.storage.local.get({ seenN: [] })
    const seen = new Set(seenN)
    let changed = false
    for (const it of items) {
        if (!it || !it.id || !it.url || seen.has(it.id)) continue
        chrome.tabs.create({ url: it.url, active: true })
        seen.add(it.id)
        changed = true
    }
    if (changed) await chrome.storage.local.set({ seenN: [...seen] })
}

chrome.alarms.create(N_ALARM, { periodInMinutes: N_MIN })
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === N_ALARM) pullN()
})
chrome.runtime.onStartup.addListener(() => pullN())

// The toolbar icon now opens the popup (action.default_popup) instead of the
// side panel. The side panel is still reachable via the open-sidebar command.
// chrome.sidePanel is Chrome-only; Firefox uses sidebar_action, so guard it.
if (chrome.sidePanel) {
    chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch(err => console.error(err))
}

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
        pullN()
    }
    chrome.runtime.setUninstallURL("https://link.aipromptgenius.app/general-uninstall")
})

chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "open-sidebar") {
        if (chrome.sidePanel && chrome.sidePanel.open) {
            // Chrome: sidePanel.open requires Chrome 116+
            const chromeVersion = (/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1]
            if (chromeVersion >= 116) {
                chrome.sidePanel.open({ windowId: tab.windowId })
            }
        } else if (globalThis.browser && browser.sidebarAction) {
            // Firefox: must run inside this user-input handler
            browser.sidebarAction.toggle()
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
