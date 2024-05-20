// update this with
const promos = [
    {
        url: "https://link.aipromptgenius.app/updated",
        promoStart: "4/10/2023", // month/day/year
        promoEnd: "4/25/2023", // WARNING: make sure start & end dates don't overlap!!
        id: "Example Dead Promo 4/10/23 - 4/25/23", // give a unique name for all promos (unique from past campaigns as well)
    },
    {
        url: "https://link.aipromptgenius.app/max-ai-4-10",
        promoStart: "4/10/2024", // month/day/year
        promoEnd: "4/24/2024", // WARNING: make sure start & end dates don't overlap!!
        id: "MaxAI.me campaign 4/10/2024 - 4/25/2024", // give a unique name for all promos - even "dead" ones
    },
    {
        url: "https://link.aipromptgenius.app/merlin-apr-25",
        promoStart: "4/25/2024", // month/day/year
        promoEnd: "5/2/2024", // WARNING: make sure start & end dates don't overlap!!
        id: "Merlin campaign 4/25 - 5/2", // give a unique name for all promos - even "dead" ones
    },
    {
        url: "https://link.aipromptgenius.app/max-ai-5-2",
        promoStart: "5/3/2024", // month/day/year
        promoEnd: "5/16/2024", // WARNING: make sure start & end dates don't overlap!!
        id: "MaxAI.me campaign 5/2/2024 - 5/16/2024", // give a unique name for all promos - even "dead" ones
    },
    {
        url: "https://link.aipromptgenius.app/MerlinPromotion",
        promoStart: "5/19/2024", // month/day/year
        promoEnd: "5/26/2024", // WARNING: make sure start & end dates don't overlap!!
        id: "Merlin campaign 5/19/2024 - 5/26/2024", // give a unique name for all promos - even "dead" ones
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
