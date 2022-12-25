if (typeof browser === "undefined") {
    chrome.action.onClicked.addListener(function(tab) {
        chrome.tabs.create({
            url: "pages/explorer.html"
        });
    });
    browser = chrome;
}
else {
    // Listen for a click on the browser action
    browser.browserAction.onClicked.addListener(function(tab) {
        // Open a new tab with the explorer page
        browser.tabs.create({
            url: "pages/explorer.html"
        });
    });
}
browser.runtime.onMessage.addListener( async function(message, sender, sendResponse) {
    if (message.type === 'b_continue_convo') {
        console.log('background received')
        browser.tabs.create({url: 'https://chat.openai.com/chat', active: true}, function (my_tab){
            let sent = false;
            browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
                if (tab.id === my_tab.id && changeInfo.status === 'complete' && !sent) {
                    setTimeout(() => browser.tabs.sendMessage(my_tab.id, {
                        type: 'c_continue_convo',
                        id: message.id,
                        convo: message.convo
                    }), 500)
                    sent = true;
                }
            });
        });
    }
	else if(message.type ==='b_use_prompt') {
		console.log('background received')
        browser.tabs.create({url: 'https://chat.openai.com/chat', active: true}, function (my_tab){
            let sent = false;
            browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
                if (tab.id === my_tab.id && changeInfo.status === 'complete' && !sent) {
                    setTimeout(() => browser.tabs.sendMessage(my_tab.id, {
                        type: 'c_use_prompt',
                        id: message.id,
                        prompt: message.prompt
                    }), 500)
                    sent = true;
                }
            });
        });
	}
});
