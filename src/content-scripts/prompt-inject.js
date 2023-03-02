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
    setTimeout(getAd, 1000)
    setTimeout(addUserPromptListener, 1000)
}

main()

async function getAd(){
    console.log("Sending message to background page");
    chrome.runtime.sendMessage({type: "ad"});
}

let adInterval;
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type === "adresponse") {
            console.log(request.ad)
            let adDiv = document.getElementById("cgpt-pg-ad")
            console.log(adDiv)
            if (adDiv){
                adDiv.innerHTML = request.ad;
            }
            else{
                adInterval = setInterval(pollAd, 1000)
            }
            function pollAd(){
                if (adDiv){
                    adDiv.innerHTML = request.ad;
                    clearInterval(adInterval)
                }
            }

            // add listeners for checkmark and
        }
    }
);

function openPrompts(){
    chrome.runtime.sendMessage({type: "openPrompts"})
}

function addUserPromptListener(){
    document.getElementById("userPrompts").addEventListener('click', openPrompts)
}

// listen for page changes
let promptURL = window.location.href;

function check_url() {
    if (promptURL !== window.location.href) {
        promptURL = window.location.href;
        setTimeout(getAd, 500)
        setTimeout(1000, addUserPromptListener)
        console.log("URL CHANGE")
    }
}
setInterval(check_url, 1000);