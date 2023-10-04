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
    return csvLines.join('\n');
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
            folder: folders.filter(folder => folder.id === prompt.folder) ,
            tags: prompt.tags.join(",")
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