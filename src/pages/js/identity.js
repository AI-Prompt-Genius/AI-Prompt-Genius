// Get OAuth2 token
function getAuthToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ 'interactive': true }, (token) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(token);
            }
        });
    });
}

function convertToCSV(data) {
    const headers = ["category", "date", "id", "tags", "text", "time", "title"];
    const rows = data.map(obj => {
        const values = [
            obj.category,
            obj.date,
            obj.id,
            obj.tags.join(";"),
            obj.text.replace(/"/g, '""'),
            obj.time,
            obj.title
        ];
        return values.map(val => `"${val}"`).join(",");
    });
    return `${headers.join(",")}\n${rows.join("\n")}`;
}

// Save data to Google Drive
async function saveToDrive(data) {
    const token = await getAuthToken();
    const fileMetadata = {
        'name': 'chrome_local_storage_backup.json',
        'parents': ['appDataFolder']
    };
    const media = {
        mimeType: 'application/json',
        body: JSON.stringify(data)
    };

    // Create a new file on Google Drive
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
            ...fileMetadata,
            ...media
        })
    });

    if (response.ok) {
        console.log('Data saved to Google Drive');
    } else {
        console.error('Error saving data to Google Drive:', response.status, response.statusText);
    }
}

// Sync chrome.storage.local data to Google Drive
chrome.storage.local.get(null, async function(data) {
    if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
    } else {
        saveToDrive(data).catch((error) => {
            console.error('Error syncing data to Google Drive:', error);
        });
    }
});