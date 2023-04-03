if (typeof browser == "undefined") {
    document.getElementById("cloudCard").classList.remove("d-none")
    setup()
}

async function setup() {
    const re = await chrome.storage.sync.get({ "cloudSyncing": false });
    if (re.cloudSyncing === false) {
        notLinked()
    } else {
        alreadyLinked()
    }
}

function notLinked() {
    document.getElementById("createNew").addEventListener("click", linkSheet)
}

async function alreadyLinked() {
    const result = await chrome.storage.sync.get(["sheetID"]);
    document.getElementById("linked-url").href = `https://docs.google.com/spreadsheets/d/${result.sheetID}`
    document.getElementById("unlinked-buttons").classList.add("d-none")
    document.getElementById("linkedDiv").classList.remove("d-none")
    document.getElementById("unlink").addEventListener("click", unlink)
}

async function unlink() {
    animate(document.getElementById("unlink"), 1000)
    let current_token = await getAuthToken()
    fetch("https://accounts.google.com/o/oauth2/revoke?token=" + current_token, {
        method: "GET"
    });
    chrome.identity.clearAllCachedAuthTokens()
    await new Promise(r => setTimeout(r, 800));
    chrome.storage.sync.set({ "cloudSyncing": false })
    chrome.storage.sync.remove(["sheetID"])
    document.getElementById("unlinked-buttons").classList.remove("d-none")
    document.getElementById("linkedDiv").classList.add("d-none")
    notLinked()
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

async function createSpreadsheet(token) {
    const metadata = {
        'name': 'ChatGPT Prompt Genius',
        'mimeType': 'application/vnd.google-apps.spreadsheet'
    };
    try {
        const response = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });
        if (!response.ok) {
            chrome.identity.clearAllCachedAuthTokens()
            await linkSheet()
            throw new Error('Failed to create new spreadsheet');
        }
        const jsonResponse = await response.json();
        return jsonResponse.id;
    } catch (error) {
        console.error(error);
    }
}

async function getPrompts() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get({'prompts': []}, function (data) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }
            else {
                resolve(data.prompts);
            }
        });
    });
}

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

async function checkForExisting(token) {
    const endpointUrl = "https://www.googleapis.com/drive/v3/files" +
        "?fields=files(id,name,mimeType,createdTime)" +
        "&q=trashed=false";
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);
    try {
        const response = await fetch(endpointUrl, {
            method: "GET",
            headers: headers
        });
        if (!response.ok) {
            throw new Error('Failed to fetch data from endpoint');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
    }
}

async function newSheet(token) {
    try {
        const spreadsheetId = await createSpreadsheet(token);
        let prompts = await getPrompts();
        prompts = prompts.map(prompt => {
            return {
                category: prompt.category,
                date: prompt.date,
                id: prompt.id,
                tags: prompt.tags.join(';'),
                text: prompt.text,
                time: prompt.time,
                title: prompt.title
            };
        });
        const values = JSONtoNestedList(prompts);
        const requestBody = {
            values: values
        };
        const range = "Sheet1!A1:Z" + values.length;
        const valueInputOption = "USER_ENTERED";
        const myToken = await getAuthToken();
        const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + spreadsheetId + '/values/' + range + '?valueInputOption=' + valueInputOption, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + myToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            throw new Error('Failed to populate spreadsheet');
        }
        console.log("Successfully populated the spreadsheet with the prompts list!");
        chrome.storage.sync.set({ "cloudSyncing": true })
        chrome.storage.sync.set({ "sheetID": spreadsheetId })
        chrome.runtime.sendMessage({params: [[],[], prompts, prompts, spreadsheetId], type:"resync"})
        alreadyLinked()
    } catch (error) {
        console.error(error);
    }
}

async function linkSheet() {
    animate(document.getElementById("createNew"), 20000);
    try {
        const token = await getAuthToken();
        const data = await checkForExisting(token);
        const existing = data.files.length !== 0;
        if (existing) {
            const sheetId = data.files[0].id;
            chrome.storage.sync.set({"cloudSyncing": true})
            chrome.storage.sync.set({"sheetID": sheetId})
            let prompts = await getPrompts()
            let promptIDList = prompts.length > 0 ? prompts.map(obj => obj.id) : []
            chrome.runtime.sendMessage({params: [[],[], promptIDList, prompts, sheetId], type:"resync"})
            alreadyLinked()
        }
        else {
            await newSheet(token);
        }
    }
    catch (error) {
        console.error(error);
    }
}

async function getSheetID(){
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get({'sheetID': ""}, function (data) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }
            else {
                resolve(data.sheetID);
            }
        });
    });
}

async function testing() {
    let prompts = await getPrompts()
    let spreadsheetId = await getSheetID()
    console.log(prompts)
    let promptIDList = prompts.length > 0 ? prompts.map(obj => obj.id) : []
    chrome.runtime.sendMessage({params: [[], [], promptIDList, prompts, spreadsheetId], type: "resync"})
}
testing()