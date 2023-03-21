let resyncInterval; let signInInterval;
const resyncButt = document.getElementById("resync-icon")
chrome.storage.local.get({v2_history: true}, function (result){
    let alreadyResynced = result.v2_history
    if (!alreadyResynced){
        animateResync()
    }
})

function animateResync(){
    resyncButt.innerHTML = `<i class="fa-solid fa-spin fa-arrows-rotate"></i>&emsp; Resyncing...`
    resyncButt.classList.add("disabled")
    chrome.storage.local.get({offset: 0}, function (result){
        checkOffsetThenResync(result.offset)
        resyncInterval = setInterval(updateResyncProgress, 4000)
    })
}

function resetButton(){
    resyncButt.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i>&emsp; Resync All`
    resyncButt.classList.remove("disabled")
    document.getElementById("resync-status").classList.add("d-none")
}

function updateResyncProgress(){
    chrome.storage.local.get({offset: 0}, function (result){
        let offset = result.offset
        document.getElementById("resync-offset").innerHTML = offset
        document.getElementById("resync-max").innerHTML = max ?? "All Threads"
        if (document.getElementById("resync-status").classList.contains("d-none")) {
            document.getElementById("resync-status").classList.remove("d-none")
        }
    })
    chrome.storage.local.get({v2_history: false}, function (result){
        let syncingFinished = result.v2_history
        if (syncingFinished){
            resetButton()
            clearInterval(resyncInterval)
            chrome.storage.local.set({alreadyResyncing: false})
        }
    })
}

function waitForSignIn(){
    chrome.storage.local.get({signedIn: false}, function (result){
        if (result.signedIn === true){
            chrome.storage.local.get({auth: null}, function (result){
                myAuth = result.auth
            })
            animateResync()
            chrome.storage.local.set({awaitingSignIn: false})
        }
    })
}

function resyncClick(){
    if (myAuth === undefined){
        window.open("https://chat.openai.com/auth/login", "_blank")
        chrome.storage.local.set({awaitingSignIn: true})
        signInInterval = setInterval(waitForSignIn, 1000)
    }
    else if (!resyncButt.classList.contains("disabled")){
        chrome.storage.local.set({v2_history: false})
        chrome.storage.local.set({offset: 0})
        animateResync()
    }
}

document.getElementById("resync-icon").addEventListener("click", resyncClick)