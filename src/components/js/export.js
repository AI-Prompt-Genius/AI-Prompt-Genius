import { getObject, uuid } from "./utils.js"
import Papa from "papaparse"

function convertToCSV(data) {
    const headers = Object.keys(data[0]) // Get the headers from the first object

    // Create an array to hold the CSV lines
    const csvLines = []

    // Push the header line to the array
    csvLines.push(headers.join(","))

    // Iterate through the data and convert each object to a CSV line
    for (const item of data) {
        const values = headers.map(header => {
            let value = item[header]

            // Check if the value contains a comma or a double quote and enclose it in double quotes if needed
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"` // Double up double quotes inside the value
            }

            return value
        })

        csvLines.push(values.join(","))
    }

    // Join all the CSV lines with newline characters
    return csvLines.join("\n")
}

export function removeDuplicatesByName(array1, array2) {
    // created by ChatGPT
    // Create a set to store unique names from array1
    const namesSet = new Set(array1.map(obj => obj))

    // Filter array2 to remove duplicates by checking if obj.name is in namesSet
    const filteredArray2 = array2.filter(obj => !namesSet.has(obj))

    return filteredArray2
}

export function getDuplicateFolders(oldArray, newArray) {
    let duplicateFolders = []

    for (let i = 0; i < oldArray.length; i++) {
        for (let j = 0; j < newArray.length; j++) {
            if (oldArray[i] === newArray[j]) {
                duplicateFolders.push(oldArray[i])
            }
        }
    }

    return duplicateFolders
}

export function combineJSONArrays(array1, array2) {
    try {
        if (array1.length === 0) return array2
        else if (array2.length === 0) return array1

        // Combine the arrays into one
        const combinedArray = array1.concat(array2)

        // Stringify the combined array
        const combinedJSON = combinedArray

        return combinedJSON
    } catch (error) {
        // Handle parsing errors
        return null
    }
}

export function csvToJson(csv) {
    const result = []
    const folders = []
    const headers = ["title", "text", "description", "folder", "tags"]

    const data = Papa.parse(csv, {
        header: false,
        skipEmptyLines: true,
    }).data

    for (let i = 1; i < data.length; i++) {
        const obj = {}

        for (let j = 0; j < headers.length; j++) {
            if (headers[j] === "tags") {
                if (data[i][j]) {
                    obj[headers[j]] = data[i][j].split(";").map(tag => tag.trim())
                } else {
                    obj[headers[j]] = []
                }
            } else {
                obj[headers[j]] = data[i][j] || ""
            }
        }

        obj["id"] = uuid()
        obj["lastChanged"] = new Date().getTime()

        result.push(obj)
    }

    return { result, folders }
}

export function downloadCSVTemplate() {
    // Encode the CSV string as a Blob
    const blob = encodeStringAsBlob(
        "Title,Text,Description,Folder,Tags - Separated with semicolons",
    )

    const filename = "AI_Prompt_Genius_Template.csv"
    // Download the Blob as a CSV file
    downloadBlobAsFile(blob, filename)
}

export function exportCsv() {
    const promptArray = getObject("prompts", [])

    const newPrompts = promptArray.map(prompt => {
        return {
            title: prompt.title,
            content: prompt.text,
            description: prompt.description,
            folder: prompt.folder,
            tags: prompt.tags.join(";"),
        }
    })
    const currentTimeString = new Date().toJSON()
    const filename = `AI-Prompt-Genius-Prompts_${currentTimeString}.csv`

    const csv = convertToCSV(newPrompts)

    // Encode the CSV string as a Blob
    const blob = encodeStringAsBlob(csv)

    // Download the Blob as a CSV file
    downloadBlobAsFile(blob, filename)
}

export function exportJson() {
    const prompts = getObject("prompts", [])
    const blob = encodeStringAsBlob(JSON.stringify(prompts))
    const currentTimeString = new Date().toJSON()
    const filename = `AI-Prompt-Genius-Prompts_${currentTimeString}.json`
    downloadBlobAsFile(blob, filename)
}

function encodeStringAsBlob(string) {
    let bytes = new TextEncoder().encode(string)
    let blob = new Blob([bytes], {
        type: "application/json;charset=utf-8",
    })
    return blob
}

const downloadBlobAsFile = (function () {
    let a = document.createElement("a")
    document.body.appendChild(a)
    a.style = "display: none"
    return function (blob, file_name) {
        let url = window.URL.createObjectURL(blob)
        a.href = url
        a.download = file_name
        a.click()
        window.URL.revokeObjectURL(url)
    }
})()
