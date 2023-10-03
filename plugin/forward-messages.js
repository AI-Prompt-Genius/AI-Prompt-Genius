window.addEventListener("message", function(event) {
    // Check the origin of the message

    // Parse the received message
    const message = JSON.parse(event.data);

    if (message.message === "openFullScreen") {
        // Forward the message to the background script
        chrome.tabs.create({ url: `${chrome.runtime.getURL("fullscreen.html")}` });
    }
}, false);