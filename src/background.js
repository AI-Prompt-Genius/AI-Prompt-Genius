if (typeof browser === "undefined") {
    let settings;
    chrome.action.onClicked.addListener(function(tab) {
        let url;
        chrome.storage.local.get(['settings'], function(result) {
            settings = result.settings
            if (settings.hasOwnProperty('home_is_prompts')) {
                if (settings.home_is_prompts === true) {
                    url = "pages/prompts.html"
                }
                else {
                    url = "pages/explorer.html"
                }
            }
            else{
                url = "pages/explorer.html"
            }
            chrome.tabs.create({url: url});
        });
        });
    browser = chrome;
}
else {
    let settings;
        // Listen for a click on the browser action
    browser.browserAction.onClicked.addListener(function(tab) {
        browser.storage.local.get(settings, function(result) {
            settings = result.settings
            let url;
            if (settings.hasOwnProperty('home_is_prompts')) {
                if (settings.home_is_prompts === true) {
                    url = "pages/prompts.html"
                }
                else{
                    url = "pages/explorer.html"
                }
            }
            else{
                url = "pages/explorer.html"
            }
            browser.tabs.create({url: url});
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
