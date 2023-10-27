export function findVariables(str) {
    // thanks chatgpt
    const regex = /{{(.+?)}}/g;
    const matches = new Set();
    let match;
    while ((match = regex.exec(str))) {
        matches.add(match[1]);
    }
    return Array.from(matches);
}

function getObjectIndexByID(id, list) {
    // created by ChatGPT
    // Iterate over the list of objects
    for (let i = 0; i < list.length; i++) {
        const obj = list[i];

        // Check if the object has an `id` property that matches the given id
        if (obj.id && obj.id === id) {
            // If a match is found, return the object
            return i;
        }
    }

    // If no match is found, return null
    return null;
}

export function setObject(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

export function getObject(key, defaultValue) {
    var value = localStorage.getItem(key);
    return value ? (value && JSON.parse(value)) : defaultValue;
}

export function getCurrentTimestamp() {
    const currentDate = new Date();
    return currentDate.getTime(); // Returns the timestamp in milliseconds since January 1, 1970 (Unix timestamp).
}

export function deletePrompt(id, prompts=null) {
    let directStorage;
    directStorage = false
    if (!prompts) {
        prompts = getObject("prompts", [])
        directStorage = true;
    }


    let promptIndex = getObjectIndexByID(id, prompts);

    if (promptIndex !== -1) {
        prompts.splice(promptIndex, 1); // Remove the prompt at the specified index
    }

    return prompts
}


export function newBlankPrompt(promptObj){
    let prompts = getObject("prompts", [])
    console.log(prompts)
    prompts.unshift(promptObj)
    return prompts;
}

export function newFilteredPrompt(promptObj, prompts){
    prompts.unshift(promptObj)
    return prompts
}

export function newFolder(name, id=null){
    let folders = getObject("folders", [])
    if (!id) {
        folders.push({name, id: uuid()})
    }
    else {
        folders.push({name: name, id: id})
    }
    return folders
}

export function editFilteredPrompts(id, editedPrompt, promptList){
    let promptIndex = getObjectIndexByID(id, promptList)
    promptList[promptIndex] = editedPrompt
    return promptList
}

export function checkProperties(obj, properties) {
    return properties.every(prop => Object.prototype.hasOwnProperty.call(obj, prop));
}

export function editPrompt(id, promptObj){
    let prompts = getObject("prompts", [])
    let promptIndex = getObjectIndexByID(id, prompts)
    prompts[promptIndex] = promptObj
    return prompts
}

export function removeFolderFromPrompts(id){
    let prompts = getObject("prompts", [])
    for (let prompt of prompts){
        if (prompt.id === id){
            prompt.id = ""
        }
    }
    return prompts
}

export function removeFolder(id){
    let folders = getObject("folders", []);
    const folderIndex = getObjectIndexByID(id, folders)
    if (folderIndex !== -1){
        folders.splice(folderIndex, 1)
    }
    return folders
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function replaceVariables(str, values) {
    const variables = findVariables(str);
    variables.forEach((variable, index) => {
        let value = values[index % values.length];
        if (value === undefined) value = "";
        const regex = new RegExp(`{{${escapeRegExp(variable)}}}`, "g");
        str = str.replace(regex, value);
    });
    return str;
}

export function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        //console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
        console.error('Async: Could not copy text: ', err);
    });
}

export function uuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}