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