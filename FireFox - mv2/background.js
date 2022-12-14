// Listen for a click on the browser action
browser.browserAction.onClicked.addListener(function(tab) {
    // Open a new tab with the explorer page
    browser.tabs.create({
        url: "explorer.html"
    });
});
