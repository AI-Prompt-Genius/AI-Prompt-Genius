browser.action.onClicked.addListener(function(tab) {
    browser.tabs.create({
        url: "explorer.html"
    });
});