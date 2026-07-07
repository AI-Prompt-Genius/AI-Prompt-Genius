window.addEventListener(
    "message",
    async function (event) {
        // Check the origin of the message

        // Parse the received message
        const message = JSON.parse(event.data)
        console.log(message)

        if (message.message === "openFullScreen") {
            // Forward the message to the background script
            chrome.tabs.create({ url: `${chrome.runtime.getURL("pages/fullscreen.html")}` })
        } else if (message.message === "openShortcuts") {
            chrome.tabs.create({ url: `chrome://extensions/shortcuts` })
        } else if (message.message === "downloadArchive") {
            exportFiles()
        } else if (message.message === "clearStorage") {
            chrome.storage.local.clear()
            chrome.storage.sync.clear()
        } else if (message.message === "openAuth") {
            const authToken = await getAuthToken()
            const response = { message: "newAuthToken", token: authToken }
            const responseStr = JSON.stringify(response)
            document
                .getElementById("window")
                .contentWindow.postMessage(responseStr, "https://lib.aipromptgenius.app")
        } else if (message.message === "clearCachedTokens") {
            chrome.identity.clearAllCachedAuthTokens()
        } else if (message.message === "sync_prompts") {
            const prompts = message.data
            chrome.storage.local.set({ currentPrompts: prompts })
        } else if (message.message === "pro_status") {
            const proStatus = message.pro
            chrome.storage.local.set({ pro: proStatus })
        }
    },
    false,
)

async function getAuthToken(interactive = true) {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: interactive }, function (token) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
                chrome.identity.clearAllCachedAuthTokens()
            } else {
                //chrome.storage.local.set({ token: token });
                resolve(token)
            }
        })
    })
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
