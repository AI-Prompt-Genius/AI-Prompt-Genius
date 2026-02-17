
const promos = [

    {
        url: "https://www.stacksocial.com/sales/voicetype-ai-voice-to-text-lifetime-subscription-unlimited-words-month",
        promoStart: "02/17/2026", // month/day/year
        promoEnd: "02/25/2026", // WARNING: make sure start & end dates don't overlap!!
        id: "Stack Social Ad", // give a unique name for all promos - even "dead" ones
    },

    // Add more promotions as needed
]

// Helper function to convert date string to Date object
function parseDate(dateString) {
    const [month, day, year] = dateString.split("/")
    return new Date(year, month - 1, day) // JavaScript months are 0-based
}

function hasSeenPromo(promoId, callback) {
    chrome.storage.local.get({ seenPromos: [] }, function (items) {
        // Check if the promoId is in the array of seen promos
        const hasSeen = items.seenPromos.includes(promoId)
        callback(hasSeen)
    })
}

function promoInBounds(promo) {
    const now = new Date()
    const promoStartDate = parseDate(promo.promoStart)
    const promoEndDate = parseDate(promo.promoEnd)

    return now >= promoStartDate && now <= promoEndDate
}

const onExtensionUpdated = () => {
    chrome.runtime.onInstalled.addListener(async details => {
        chrome.storage.local.get({ pro: false }, function (result) {
            const pro = result.pro
            if (pro) return
            if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) return

            promos.forEach(promo => {
                if (promoInBounds(promo)) {
                    chrome.tabs.create({
                        url: promo.url,
                        active: true,
                    })

                    /* Mark the promo as seen by adding its id to the seenPromos array
                    chrome.storage.local.get({ seenPromos: [] }, function (items) {
                        const updatedSeenPromos = [...items.seenPromos, promo.id]
                        chrome.storage.local.set({ seenPromos: updatedSeenPromos })
                    })*/
                }
            })
        })
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
