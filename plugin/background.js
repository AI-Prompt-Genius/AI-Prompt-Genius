chrome.runtime.onInstalled.addListener(function(details) {
    console.log(details)
    if (details.reason === "install") {
        chrome.tabs.create({ url: chrome.runtime.getURL("fullscreen.html") });
    }
    else if (details.reason === "update") {
        // Handle update logic if needed
        chrome.storage.local.get({"isCompact": "nahhh"}, function (re){
            if (re.isCompact !== null){
                chrome.tabs.create({ url: chrome.runtime.getURL("fullscreen.html") });
            }
            else {
                //
                console.error("HEYYY")
                return null;
            }
        })
    }
    chrome.tabs.create({ url: chrome.runtime.getURL("fullscreen.html") });
});
console.error("HEYYY")


/*chrome.commands.onCommand.addListener((command, tab) => {
    console.error(`Command: ${command}`);
    if (command === "open-sidebar"){
        chrome.sidePanel.open({ windowId: tab.windowId })
    }
});*/

