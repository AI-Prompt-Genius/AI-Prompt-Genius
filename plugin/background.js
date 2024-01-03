const onExtensionUpdated = () => {
    chrome.runtime.onInstalled.addListener(async details => {
        if (details.reason !== chrome.runtime.OnInstalledReason.INSTALL) {
            await chrome.tabs.create({
                url: "https://link.aipromptgenius.app/updated", // redirects to https://www.extensions-hub.com/ai-prompt-genius/updated
                active: true,
            })
        }
    })
}
onExtensionUpdated()

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
