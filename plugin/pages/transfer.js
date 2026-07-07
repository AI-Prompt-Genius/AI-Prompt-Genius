window.addEventListener(
    "message",
    async function (event) {
        // Parse the received message
        const message = JSON.parse(event.data)

        if (message.message === "getTransfer") {
            sendMessage(response)
        }
    },
    false,
)

let response
async function main() {
    // Old prompts/language live in this page's localStorage (same chrome-extension:// origin
    // the legacy popup/pages used) — not chrome.storage.local, which the app never wrote these to.
    const prompts = JSON.parse(localStorage.getItem("prompts") || "[]").reverse()
    const lang = localStorage.getItem("lng") || "en"
    response = { message: "transfer", prompts: prompts, lang: lang }
}
main()

function sendMessage(msg) {
    const messageStr = JSON.stringify(msg)
    document
        .getElementById("window")
        .contentWindow.postMessage(messageStr, "https://lib.aipromptgenius.app")
    console.log(msg)
    console.log("sent message to child")
}
