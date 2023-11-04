window.addEventListener("message", async function(event) {
    // Check the origin of the message

    // Parse the received message
    const message = JSON.parse(event.data);

    if (message.message === "openFullScreen") {
        // Forward the message to the background script
        chrome.tabs.create({ url: `${chrome.runtime.getURL("fullscreen.html")}` });
    }
    else if (message.message === "openAuth"){
        const authToken = await getAuthToken()
        const response = {message: "newAuthToken", token: authToken}
        const responseStr = JSON.stringify(response)
        document.getElementById("window").contentWindow.postMessage(responseStr, "*")
        console.log(response)
        console.log("SENT MESSAGE TO CHILD")
    }
    else if (message.message === "clearCachedTokens"){
        chrome.identity.clearAllCachedAuthTokens();
    }

}, false);

async function getAuthToken(interactive=true) {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: interactive }, function (token) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                chrome.identity.clearAllCachedAuthTokens();
            } else {
                //chrome.storage.local.set({ token: token });
                resolve(token);
            }
        });
    });
}