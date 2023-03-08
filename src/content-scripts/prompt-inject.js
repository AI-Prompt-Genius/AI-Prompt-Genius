function main() {
    chrome.storage.local.get({prompts: []}, function (result) {
        let prompts = JSON.stringify(result.prompts)
        document.body.appendChild(document.createElement(`input`)).setAttribute("id", "prompts_storage")
        document.querySelector("#prompts_storage").setAttribute("type", "hidden")
        document.querySelector("#prompts_storage").value = prompts
    })
    chrome.storage.local.get({isCompact: false}, function (result){
        let isCompact = JSON.stringify(result.isCompact)
        document.body.appendChild(document.createElement(`input`)).setAttribute("id", "isCompact")
        document.querySelector("#isCompact").setAttribute("type", "hidden")
        document.querySelector("#isCompact").value = isCompact
    })
    injectScript(chrome.runtime.getURL('content-scripts/prompts.js'), 'body');
    setTimeout(bridge, 500)
}

main()

function bridge(){ // this is to set up the functions when the page is ready
    console.log("bridge")
    if (document.getElementById("compact")){
        getAd()
        addUserPromptListener()
    }
    else if (window.location.href === "https://chat.openai.com/chat"){
        setTimeout(bridge, 500)
    }
}

async function getAd(){
    console.log("Sending message to background page");
    chrome.runtime.sendMessage({type: "ad"});
}

let adInterval; let adcontent;
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type === "adresponse") {
            let adDiv = document.getElementById("cgpt-pg-ad")
            adcontent = request.ad
            if (adDiv){
                adDiv.innerHTML = adcontent;
            }
            else{
                adInterval = setInterval(pollAd, 1000)
            }
            function pollAd(){
                if (adDiv){
                    adDiv.innerHTML = adcontent;
                    clearInterval(adInterval)
                }
            }
        }
    }
);

function openPrompts(){
    chrome.runtime.sendMessage({type: "openPrompts"})
}

function saveCompact(){
    let isCompact = document.getElementById("compact").checked
    console.log(isCompact)
    chrome.storage.local.set({isCompact: isCompact})
}

function addUserPromptListener(){
    document.getElementById("userPrompts").addEventListener('click', openPrompts)
    document.getElementById("compact").addEventListener("click", saveCompact)
}

let newChatButton = document.querySelector('nav').firstChild
newChatButton.addEventListener('click', () => {
    setTimeout(bridge, 500)
})

// listen for page changes
let promptURL = window.location.href;

function check_url() {
    if (promptURL !== window.location.href) {
        promptURL = window.location.href;
        bridge()
        console.log("URL CHANGE")
    }
}
setInterval(check_url, 1000);