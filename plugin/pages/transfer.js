window.addEventListener("message", async function(event) {
    // Check the origin of the message

    // Parse the received message
    const message = JSON.parse(event.data);

    if (message.message === "getTransfer") {
        setTimeout(() => sendMessage(message), 500)
    }
}, false)

let message;
async function main(){
    const promptObj = await chrome.storage.local.get({prompts: []})
    const prompts = await promptObj.prompts;

    const langObj = await chrome.storage.local.get({lang: "en"})
    const lang = await langObj.lang
    message = {message: "transfer", prompts: prompts, lang: lang}
}
main()

function sendMessage(message){
    const messageStr = JSON.stringify(message)
    document.getElementById("window").contentWindow.postMessage(messageStr, "*")
    console.log("sent message to child")
}