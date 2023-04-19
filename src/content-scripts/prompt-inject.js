function bigWrapper() {
    function main() {
        chrome.storage.local.get({prompts: []}, function (result) {
            let prompts = JSON.stringify(result.prompts)
            document.body.appendChild(document.createElement(`input`)).setAttribute("id", "prompts_storage")
            document.querySelector("#prompts_storage").setAttribute("type", "hidden")
            document.querySelector("#prompts_storage").value = prompts
        })
        chrome.storage.local.get({isCompact: false}, function (result) {
            let isCompact = JSON.stringify(result.isCompact)
            document.body.appendChild(document.createElement(`input`)).setAttribute("id", "isCompact")
            document.querySelector("#isCompact").setAttribute("type", "hidden")
            document.querySelector("#isCompact").value = isCompact
        })
        setTimeout(() => injectScript(chrome.runtime.getURL('content-scripts/prompts.js'), 'body'), 500)
        setTimeout(bridge, 500)
    }

    main()

    function bridge() { // this is to set up the functions when the page is ready
        console.log("bridge")
        let isMainPage = window.location.href.split("/").length === 4
        console.log("ISMAINPAGE!")
        if (document.getElementById("compact")) {
            getAd()
            addUserPromptListener()
            getAccountStatus()
        }
        else if (isMainPage) {
            setTimeout(bridge, 500)
        }
        newChatSetup()
    }

    async function getAd() {
        console.log("Sending message to background page");
        chrome.runtime.sendMessage({type: "ad"});
    }

    let adInterval;
    let adcontent;
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.type === "adresponse") {
                console.log("AD RECEIVED")
                let adDiv = document.getElementById("cgpt-pg-ad")
                console.log(adDiv)
                adcontent = request.ad
                console.log(adcontent)
                if (adDiv) {
                    console.log("TRUE")
                    adDiv.innerHTML = adcontent
                }
                else {
                    adInterval = setInterval(pollAd, 1000)
                }

                function pollAd() {
                    if (adDiv) {
                        adDiv.innerHTML = adcontent;
                        clearInterval(adInterval)
                    }
                }
            }
        }
    );

    function openPrompts() {
        chrome.runtime.sendMessage({type: "openPrompts"})
    }

    function saveCompact() {
        let isCompact = document.getElementById("compact").checked
        console.log(isCompact)
        chrome.storage.local.set({isCompact: isCompact})
    }

    function addUserPromptListener() {
        document.getElementById("userPrompts").addEventListener('click', openPrompts)
        document.getElementById("compact").addEventListener("click", saveCompact)
    }

    function newChatSetup() {
        let newChatButton = document.querySelector('nav').firstChild
        newChatButton.addEventListener('click', () => {
            setTimeout(bridge, 500)
        })
    }

    

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
}

chrome.storage.local.get({settings: {}}, function (result){
    let dontInject = result.settings?.dont_inject_prompts ?? false
    let isPlus = result.settings?.is_plus ?? false
    console.log("DONT INJECT " + dontInject)
    if (!dontInject){
        bigWrapper()
    }
    let plusVal = JSON.stringify(isPlus)
    document.body.appendChild(document.createElement(`input`)).setAttribute("id", "plusManual")
    document.querySelector("#plusManual").setAttribute("type", "hidden")
    document.querySelector("#plusManual").value = plusVal
})