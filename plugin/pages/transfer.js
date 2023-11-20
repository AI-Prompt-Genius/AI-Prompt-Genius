async function main(){
    const promptObj = await chrome.storage.local.get({prompts: []})
    const prompts = await promptObj.prompts;

    const message = {message: "transfer", prompts: prompts}
    setTimeout(() => sendMessage(message), 1000)

    function sendMessage(message){
        const messageStr = JSON.stringify(message)
        document.getElementById("window").contentWindow.postMessage(messageStr, "*")
        console.log("sent message to child")
    }
}
main()