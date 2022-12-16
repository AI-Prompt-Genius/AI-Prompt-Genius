if (typeof browser === "undefined") {
    chrome.action.onClicked.addListener(function(tab) {
        chrome.tabs.create({
            url: "explorer.html"
        });
    });
    browser = chrome;
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
browser.runtime.onMessage.addListener( async function(message, sender, sendResponse) {
    if (message.type === 'b_continue_convo') {
        console.log('background recieved')
        browser.tabs.create({url: 'https://chat.openai.com/chat', active: true});
        const my_tab = await browser.tabs.query({active: true, lastFocusedWindow: true});
        setTimeout(() => {browser.tabs.sendMessage(my_tab[0].id, {type: 'c_continue_convo', id: message.id, convo: message.convo})}, 1000)
    }
});
