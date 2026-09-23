window.addEventListener(
    "message",
    function (event) {
        // Check the origin of the message

        // Parse the received message
        const message = JSON.parse(event.data)
        console.log(message)

        if (message.message === "openFullScreen") {
            // Forward the message to the background script
            chrome.tabs.create({ url: `${chrome.runtime.getURL("pages/fullscreen.html")}` })
        } else if (message.message === "openShortcuts") {
            // chrome://extensions/shortcuts is Chrome-only. Firefox has no linkable
            // shortcuts sub-page, so send Firefox users to about:addons where they
            // can open ⚙ → "Manage Extension Shortcuts".
            if (globalThis.browser && browser.sidebarAction) {
                chrome.tabs.create({ url: `about:addons` })
            } else {
                chrome.tabs.create({ url: `chrome://extensions/shortcuts` })
            }
        } else if (message.message === "downloadArchive") {
            exportFiles()
        } else if (message.message === "clearStorage") {
            clearStorageKeepingPro()
            chrome.storage.sync.clear()
        } else if (message.message === "sync_prompts") {
            const prompts = message.data
            chrome.storage.local.set({ currentPrompts: prompts })
        } else if (message.message === "pro_status") {
            // Mirror the license key too, not just the boolean: background.js has no access to
            // the app's localStorage, and without a key it can only trust this mirror — which
            // defaults to false and would nag a paying user who hasn't opened the app lately.
            const patch = {
                pro: !!message.pro,
                proCheckedAt: Date.now(),
                proExpiresAt: Number.isFinite(message.proExpiresAt) ? message.proExpiresAt : 0,
            }
            if (typeof message.proKey === "string") patch.proKey = message.proKey
            else if (message.proKey === null) patch.proKey = null
            chrome.storage.local.set(patch)
        } else if (message.message === "set_toolbar_target") {
            chrome.storage.local.set({ toolbarTarget: message.target })
        }
    },
    false,
)

// "Clear storage" means the user's prompt data, not their purchase. A blanket clear() used to
// drop the Pro mirror while the app's own localStorage stayed Pro — the app kept showing Pro
// while background.js reverted to treating them as a free user.
function clearStorageKeepingPro() {
    chrome.storage.local.get(
        { pro: false, proKey: null, proCheckedAt: 0, proExpiresAt: 0 },
        function (kept) {
            chrome.storage.local.clear(function () {
                chrome.storage.local.set(kept)
            })
        },
    )
}

function exportFiles(h = true, p = true, s = true) {
    chrome.storage.local.get(["threads", "prompts", "settings"], function (result) {
        let threads = result.threads ?? []
        let prompts = result.prompts ?? []
        let settings = result.settings ?? []
        let title = ""

        let data = {}
        if (h) {
            data.threads = threads
            title += "-History"
        }
        if (p) {
            data.prompts = prompts
            title += "-Prompts"
        }
        if (s) {
            data.settings = settings
            title += "-Settings"
        }

        let string = JSON.stringify(data)
        let blob = encodeStringAsBlob(string)
        let currentTimeString = new Date().toJSON()
        let filename = `AI-Prompt-Genius-Archive${title}_${currentTimeString}.txt`
        downloadBlobAsFile(blob, filename)
    })
}

function encodeStringAsBlob(string) {
    let bytes = new TextEncoder().encode(string)
    let blob = new Blob([bytes], {
        type: "application/json;charset=utf-8",
    })
    return blob
}

const downloadBlobAsFile = (function () {
    let a = document.createElement("a")
    document.body.appendChild(a)
    a.style = "display: none"
    return function (blob, file_name) {
        let url = window.URL.createObjectURL(blob)
        a.href = url
        a.download = file_name
        a.click()
        window.URL.revokeObjectURL(url)
    }
})()
