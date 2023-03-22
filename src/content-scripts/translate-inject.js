let messages;
function checkForMessages(){
    let messagesRaw = document.querySelector('#pr-messages')?.value;
    if (messagesRaw){
        messages = JSON.parse(messagesRaw)
        console.log("SAVING MESSAGES NOW!")
    }
    else {
        console.log("NO MESSAGES YET")
        setTimeout(checkForMessages, 500)
    }
}
checkForMessages()

function tr(key, translations=messages) {
    console.log("Translating " + key)
    if (translations[key]) {
        console.log(translations[key].message)
        return translations[key].message;
    }
}