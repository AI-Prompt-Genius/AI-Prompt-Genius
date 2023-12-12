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
    const promptObj = await chrome.storage.local.get({ prompts: [] })
    const prompts = await promptObj.prompts.reverse()

    const langObj = await chrome.storage.local.get({ lang: "en" })
    const lang = await langObj.lang
    response = { message: "transfer", prompts: prompts, lang: lang }
}
main()

function sendMessage(msg) {
    const messageStr = JSON.stringify(msg)
    document.getElementById("window").contentWindow.postMessage(messageStr, "https://lib.aipromptgenius.app")
    console.log(msg)
    console.log("sent message to child")
}
