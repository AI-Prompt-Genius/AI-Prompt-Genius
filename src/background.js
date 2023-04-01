if (typeof browser !== "undefined") {
    chrome.action = browser.browserAction
}
let settings;
// Listen for a click on the browser action
chrome.action.onClicked.addListener(function(tab) {
    chrome.storage.local.get({settings: {home_is_prompts: true}}, function(result) {
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
            url = "pages/prompts.html"
        }
        chrome.tabs.create({url: url});
    });
});


chrome.runtime.onMessage.addListener( async function(message) {
    if (message.type === 'b_continue_convo') {
        console.log('background received')
        chrome.tabs.create({url: 'https://chat.openai.com/chat', active: true}, function (my_tab){
            let sent = false;
            chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
                if (tab.id === my_tab.id && changeInfo.status === 'complete' && !sent) {
                    setTimeout(() => chrome.tabs.sendMessage(my_tab.id, {
                        type: 'c_continue_convo',
                        id: message.id,
                        convo: message.convo
                    }), 500)
                    sent = true;
                }
            });
        });
    }
    else if (message.type === "openPrompts"){
        let url = chrome.runtime.getURL('pages/prompts.html')
        chrome.tabs.create({url: url})
    }
    else if(message.type ==='b_use_prompt') {
        console.log('background received')
        chrome.tabs.create({url: 'https://chat.openai.com/chat', active: true}, function (my_tab){
            let sent = false;
            chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
                if (tab.id === my_tab.id && changeInfo.status === 'complete' && !sent) {
                    setTimeout(() => chrome.tabs.sendMessage(my_tab.id, {
                        type: 'c_use_prompt',
                        id: message.id,
                        prompt: message.prompt
                    }), 500)
                    sent = true;
                }
            });
        });
    }
    else if (message.type === "ad"){
        console.log("HEY!")
        const host = `https://raw.githubusercontent.com/benf2004/ChatGPT-History/master/public`;
        const rando = generateUUID() // to not get cached version because headers were causing problems.
        const response = await fetch(`${host}/ads/current.txt?dummy=${rando}`);
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        const text = await response.text();
        console.log({ad:text});
        chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
            const [tab] = tabs;
            chrome.tabs.sendMessage(tab.id, {ad: text, type: "adresponse"});
        });
    }
    else if (message.type === "resync"){
        console.log("resyncing!")
        let mp = message.params
        syncPrompts(mp[0], mp[1], mp[2], mp[3], mp[4])
    }
});

function JSONtoNestedList(prompts) {
    let values = []
    const headers = Object.keys(prompts[0]);
    values.push(headers)
    for (let prompt of prompts) {
        let list = []
        for (let key of Object.keys(prompt)) {
            if (Array.isArray(prompt[key])) {
                list.push(prompt[key].join(";"));
            } else {
                list.push(prompt[key]);
            }
        }
        values.push(list)
    }
    return values
}

function mergePrompts(localPrompts, cloudPrompts) {
    // Create a copy of the local prompts array
    const mergedPrompts = JSON.parse(JSON.stringify(localPrompts));

    // Merge in cloud prompts
    cloudPrompts.forEach(cloudPrompt => {
        const existingIndex = mergedPrompts.findIndex(localPrompt => localPrompt.id === cloudPrompt.id);
        if (existingIndex === -1) { // not an existing prompt
            // Add new prompt
            mergedPrompts.push(cloudPrompt);
        } else {
            // Update existing prompt
            mergedPrompts[existingIndex] = Object.assign({}, mergedPrompts[existingIndex], cloudPrompt);
        }
    });

    return mergedPrompts;
}

async function updateSheetData(spreadsheetId, range, data) {
    try {
        const token = await getAuthToken();
        const values = JSONtoNestedList(data);
        const requestBody = {
            values: values
        };
        const valueInputOption = "USER_ENTERED";
        const endpointUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=${valueInputOption}`;
        const response = await fetch(endpointUrl, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            throw new Error('Failed to update spreadsheet');
        }
    }
    catch (error) {
        console.error(error);
    }
}

async function getAuthToken() {
    console.log("gettingToken")
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(token);
            }
        });
    });
}

async function getSheetData(spreadsheetId, range) {
    try {
        const mumboJumbo = "AIzaSyAjjnHsq4rkzK7jtjZ_zvs62lT8nqeQVoU" // this isn't dangerous but you can ignore it
        const token = await getAuthToken();
        const endpointUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${mumboJumbo}`;
        const headers = new Headers();
        headers.append("Authorization", `Bearer ${token}`);
        const response = await fetch(endpointUrl, {
            method: "GET",
            headers: headers
        });
        if (!response.ok) {
            throw new Error('Failed to fetch data from endpoint');
        }
        const data = await response.json();
        console.log((data))
        const headersRow = data.values[0];
        const values = data.values.slice(1);
        const jsonData = values.map(row => {
            const obj = {};
            headersRow.forEach((header, index) => {
                if (header === "tags") {
                    console.log("tags!")
                    obj[header] = row[index].split(';');
                }
                else {
                    obj[header] = row[index];
                }
            });
            return obj;
        });
        console.log(jsonData)
        return jsonData;
    } catch (error) {
        console.error(error);
    }
}

async function syncPrompts(deletedPrompts, newPrompts, changedPrompts, localPrompts, sheetId) {
    try {
        // Get prompts from the Google Sheets version
        const sheetData = await getSheetData(sheetId, "Sheet1!A1:G");
        console.log(sheetData)

        // Remove deleted prompts from the cloud version
        deletedPrompts.forEach(id => {
            const index = sheetData.findIndex(prompt => prompt.id === id);
            if (index !== -1) {
                sheetData.splice(index, 1);
            }
        });

        // Merge local and cloud version for changed prompts
        changedPrompts.concat(newPrompts).forEach(changedP => {
            let id = changedP.id
            console.log(localPrompts)
            const localPrompt = localPrompts.find(prompt => prompt.id === id);
            const cloudPrompt = sheetData.find(prompt => prompt.id === id);

            if (localPrompt) {
                if (!cloudPrompt){
                    sheetData.push(localPrompt)
                }
                else {
                    // Merge the two prompts
                    cloudPrompt.text = localPrompt?.text;
                    cloudPrompt.time = localPrompt?.time;
                    cloudPrompt.category = localPrompt?.category;
                    console.log(localPrompt.tags)
                    cloudPrompt.tags = localPrompt?.tags.join(";");

                    // Find the index of the merged prompt in the sheetData array
                    const index = sheetData.findIndex(prompt => prompt.id === id);

                    // Replace the old prompt with the merged prompt
                    if (index !== -1) {
                        sheetData[index] = cloudPrompt;
                    }
                    else {
                        sheetData.push(cloudPrompt);
                    }
                }
            }
        });

        // Update the Chrome storage version with the merged data
        const mergedData = mergePrompts(localPrompts, sheetData);
        const correctTags = []
        for (let prompt of mergedData){
            console.log(prompt)
            if (typeof prompt.tags === "string") {
                prompt.tags = prompt.tags.split(";")
            }
            correctTags.push(prompt)
        }
        chrome.storage.local.set({'prompts': correctTags});

        // Update the Google Sheets version with the merged data
        await updateSheetData(sheetId, "Sheet1!A1:G", sheetData);
    }
    catch (error) {
        console.error(error);
    }
}

async function setUninstallURL(){
    const host = `https://raw.githubusercontent.com/benf2004/ChatGPT-History/master/public`;
    const rando = generateUUID() // to not get cached version because headers were causing problems.
    const response = await fetch(`${host}/ads/currentUrl.txt?dummy=${rando}`);
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    const url = await response.text();
    chrome.runtime.setUninstallURL(url)
}
setUninstallURL()

function getDate() { // generated by ChatGPT
    var date = new Date();
    var options = {year: 'numeric', month: 'long', day: 'numeric'};
    return date.toLocaleString('default', options);
}

function getTime() { // generated by ChatGPT
    var currentDate = new Date();
    var options = {
        hour12: true,
        hour: "numeric",
        minute: "numeric"
    };
    var timeString = currentDate.toLocaleTimeString("default", options);
    return timeString
}

function generateUUID() { // generated by ChatGPT
    // create an array of possible characters for the UUID
    var possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // create an empty string that will be used to generate the UUID
    var uuid = "";

    // loop over the possible characters and append a random character to the UUID string
    for (var i = 0; i < 36; i++) {
        uuid += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    }

    // return the generated UUID
    return uuid;
}

function new_prompt(title, text, tags="", category="") {
    let prompt = {
        date: getDate(),
        time: getTime(),
        id: generateUUID(),
        title: title,
        text: text,
        tags: tags,
        category: category
    };
    return prompt;
}
chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: "savePrompt",
        title: "Save text as prompt",
        contexts: ["selection"],
    });

});


chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "savePrompt") {
        chrome.storage.local.get({prompts: []}, function(result) {
            let prompts = result.prompts
            prompts.push(new_prompt("", info.selectionText))
            chrome.storage.local.set({prompts: prompts})
            chrome.tabs.create({url: "pages/prompts.html"});
            setTimeout(() => chrome.runtime.sendMessage({message: "New Prompt"}), 300)
        });
    }
});

chrome.storage.local.get({autoDetectedLocale: false}, function (result){
    if (!result.autoDetectedLocale){
        let acceptedLanguages = ["en", "zh_CN", "fr, zh_TW", "uk"]
        chrome.i18n.getAcceptLanguages(function (languages){
            console.log(languages)
            for (let lang of languages){
                lang = lang.replace("-", "_")
                if (acceptedLanguages.includes(lang)){
                    chrome.storage.local.set({lang: lang})
                    chrome.storage.local.set({autoDetectedLocale: true})
                    break;
                }
                else if (acceptedLanguages.includes(lang.split("_")[0])){
                    chrome.storage.local.set({lang: lang.split("_")[0]})
                    chrome.storage.local.set({autoDetectedLocale: true})
                    break;
                }
            }
        })
    }
})