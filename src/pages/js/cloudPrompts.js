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
    chrome.storage.local.get({"prompts": []}, function (r){
        syncPrompts([],[], r.prompts, r.prompts, result.sheetID)
    })
}

async function unlink() {
    animate(document.getElementById("unlink"), 1000)
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
        chrome.storage.local.get('prompts', function (data) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
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
            //prompt.tags = prompt.tags.split(";")
            correctTags.push(prompt)
        }
        chrome.storage.local.set({'prompts': mergedData});

        // Update the Google Sheets version with the merged data
        await updateSheetData(sheetId, "Sheet1!A1:G", sheetData);
    }
    catch (error) {
        console.error(error);
    }
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
        const range = "Sheet1!A1:G" + values.length;
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
        alreadyLinked()
    } catch (error) {
        console.error(error);
    }
}

async function linkSheet() {
    animate(document.getElementById("createNew"), 60000);
    try {
        const token = await getAuthToken();
        const data = await checkForExisting(token);
        const existing = data.files.length !== 0;
        if (existing) {
            const sheetId = data.files[0].id;
            chrome.storage.sync.set({"cloudSyncing": true})
            chrome.storage.sync.set({"sheetID": sheetId})
            alreadyLinked()
        }
        else {
            await newSheet(token);
        }
    } catch (error) {
        console.error(error);
    }
}