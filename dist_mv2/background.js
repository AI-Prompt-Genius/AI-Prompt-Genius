if (typeof browser === "undefined") {
    chrome.action.onClicked.addListener(function(tab) {
        chrome.tabs.create({
            url: "explorer.html"
        });
    });
}
else {
    // Listen for a click on the browser action
    browser.browserAction.onClicked.addListener(function(tab) {
        // Open a new tab with the explorer page
        browser.tabs.create({
            url: "explorer.html"
        });
    });
}
