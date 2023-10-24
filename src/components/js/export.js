import {uuid} from "./utils.js";
import Papa from 'papaparse';

function convertToCSV(data) {
    const headers = Object.keys(data[0]); // Get the headers from the first object

    // Create an array to hold the CSV lines
    const csvLines = [];

    // Push the header line to the array
    csvLines.push(headers.join(','));

    // Iterate through the data and convert each object to a CSV line
    for (const item of data) {
        const values = headers.map(header => {
            let value = item[header];

            // Check if the value contains a comma or a double quote and enclose it in double quotes if needed
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`; // Double up double quotes inside the value
            }

            return value;
        });

        csvLines.push(values.join(','));
    }

    // Join all the CSV lines with newline characters
    return csvLines.join('\n')
}

export function removeDuplicatesByName(array1, array2, propName="title") { // created by ChatGPT
    // Create a set to store unique names from array1
    const namesSet = new Set(array1.map(obj => obj[propName]));

    // Filter array2 to remove duplicates by checking if obj.name is in namesSet
    const filteredArray2 = array2.filter(obj => !namesSet.has(obj[propName]));

    return filteredArray2;
}

export function getDuplicateFolders(oldArray, newArray) {
    let duplicateFolders = [];

    for (let i = 0; i < oldArray.length; i++) {
        for (let j = 0; j < newArray.length; j++) {
            if (oldArray[i].name === newArray[j].name) {
                duplicateFolders.push({
                    oldFolderId: oldArray[i].id,
                    newFolderId: newArray[j].id,
                });
            }
        }
    }

    return duplicateFolders;
}


export function sanitizeNewPrompts(prompts, duplicateFolders) { // created by ChatGPT
    // Create a map of newFolderId to oldFolderId for efficient lookup
    const folderIdMap = new Map();
    duplicateFolders.forEach(({ oldFolderId, newFolderId }) => {
        folderIdMap.set(newFolderId, oldFolderId);
    });
    // Iterate through the prompts and replace newFolderId with oldFolderId if necessary
    const sanitizedPrompts = prompts.map((prompt) => {
        const oldFolderId = folderIdMap.get(prompt.folder);
        if (oldFolderId !== undefined) {
            return { ...prompt, folder: oldFolderId };
        }
        return prompt;
    });

    return sanitizedPrompts;
}


export function combineJSONArrays(array1, array2) {

    try {
        if (array1.length === 0) return JSON.stringify(array2)
        if (array2.length === 0) return JSON.stringify(array1)

        // Combine the arrays into one
        const combinedArray = array1.concat(array2);

        // Stringify the combined array
        const combinedJSON = JSON.stringify(combinedArray);

        return combinedJSON;
    } catch (error) {
        // Handle parsing errors
        return null;
    }
}

export function csvToJson(csv) {
    const result = [];
    const folders = [];
    const folderMap = new Map();
    const headers = ["title", "content", "description", "folder", "tags"];

    const data = Papa.parse(csv, {
        header: false,
        skipEmptyLines: true,
    }).data;

    for(let i = 1; i < data.length; i++) {
        const obj = {};

        for(let j = 0; j < headers.length; j++) {
            if (headers[j] === "folder") {
                let folderName = data[i][j];
                let folderID = ""
                if (folderName !== "" && folderName !== " ") {
                    if (folderMap.has(folderName)) {
                        folderID = folderMap.get(folderName);
                    } else {
                        folderID = uuid();
                        folderMap.set(folderName, folderID);
                        folders.push({name: folderName, id: folderID});
                    }
                }

                obj[headers[j]] = folderID;
            } else if (headers[j] === "tags") {
                if (data[i][j]) {
                    obj[headers[j]] = data[i][j].split(';').map(tag => tag.trim());
                } else {
                    obj[headers[j]] = [];
                }
            } else {
                obj[headers[j]] = data[i][j] || '';
            }
        }

        obj["id"] = uuid();
        obj["lastEdited"] = new Date().getTime();

        result.push(obj);
    }

    return {result, folders};
}

export function downloadCSVTemplate(){
    // Encode the CSV string as a Blob
    const blob = encodeStringAsBlob("Title,Content,Description,Folder,Tags - Separated with semicolons");

    const filename = "AI_Prompt_Genius_Template.csv"
    // Download the Blob as a CSV file
    downloadBlobAsFile(blob, filename);
}

export function exportCsv(){
    const promptStr = localStorage.getItem("prompts")
    const promptArray = JSON.parse(JSON.parse(promptStr))

    const folderStr = localStorage.getItem("folders")
    const folders = JSON.parse(JSON.parse(folderStr))

    const newPrompts = promptArray.map((prompt) => {
        return {
            title: prompt.title,
            content: prompt.text,
            description: prompt.description,
            folder: folders.find(folder => folder.id === prompt.folder)?.name || "",
            tags: prompt.tags.join(";")
        };
    });
    const currentTimeString = new Date().toJSON();
    const filename = `AI-Prompt-Genius-Prompts_${currentTimeString}.csv`;

    const csv = convertToCSV(newPrompts);

    // Encode the CSV string as a Blob
    const blob = encodeStringAsBlob(csv);

    // Download the Blob as a CSV file
    downloadBlobAsFile(blob, filename);
}

export function exportJson(){
    const prompts = JSON.parse(JSON.parse(localStorage.getItem("prompts")))
    const folders = JSON.parse(JSON.parse(localStorage.getItem("folders")))
    prompts.forEach(prompt => prompt.folder = folders.find(folder => folder.id === prompt.folder)?.name || "")
    const blob = encodeStringAsBlob(JSON.stringify(prompts));
    const currentTimeString = new Date().toJSON();
    const filename = `AI-Prompt-Genius-Prompts_${currentTimeString}.json`;
    downloadBlobAsFile(blob, filename);
}

function encodeStringAsBlob(string) {
    let bytes = new TextEncoder().encode(string);
    let blob = new Blob([bytes], {
        type: "application/json;charset=utf-8",
    });
    return blob;
}

const downloadBlobAsFile = (function () {
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (blob, file_name) {
        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = file_name;
        a.click();
        window.URL.revokeObjectURL(url);
    };
})();