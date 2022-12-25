if (typeof browser === "undefined") {
    browser = chrome
}
if (typeof firefox !== undefined && firefox === false){
    console.log(document.querySelector('.export').innerHTML)
    document.querySelector('.export').classList.remove('d-none')
}

function update_settings(){
    let buttons = document.querySelector('#exportButtonsToggle').checked
    let auto_delete = document.querySelector('#autoDeleteToggle').checked
    let auto_send = document.querySelector('#autoSendToggle').checked
    let message = document.querySelector('#defaultMessageInput').value
    let settings = {buttons: buttons, auto_send: auto_send, auto_delete: auto_delete, message: message}
    browser.storage.local.set({settings: settings})
}
let typingTimer;

function text_delay(){
    clearTimeout(typingTimer)
    typingTimer = setTimeout(update_settings, 500)
}

document.querySelector('#exportButtonsToggle').addEventListener('change', update_settings)
document.querySelector('#autoDeleteToggle').addEventListener('change', update_settings)
document.querySelector('#autoSendToggle').addEventListener('change', update_settings)
document.querySelector('textarea').addEventListener('input', text_delay)

function load_settings(){
    let defaults = {buttons: true, auto_send: true, auto_delete: false, message: "The following is a transcript of a conversation between me and ChatGPT. Use it for context in the rest of the conversation. Be ready to edit and build upon the responses previously given by ChatGPT. Respond \"ready!\" if you understand the context. Do not respond with anything else. Conversation:\n"}
    browser.storage.local.get({settings: defaults}, function(result) {
        document.querySelector('#exportButtonsToggle').checked = result.settings.buttons
        document.querySelector('#autoDeleteToggle').checked = result.settings.auto_delete
        document.querySelector('#autoSendToggle').checked = result.settings.auto_send
        document.querySelector('textarea').value = result.settings.message
    })
}
load_settings()

function settings_dark(){
    if (document.body.classList.contains('light')) {
        document.querySelector('table').classList.remove('table-dark')
    }
    else {
        document.querySelector('table').classList.add('table-dark')
    }
}
setTimeout(settings_dark, 50)
document.body.querySelector('#light_dark').addEventListener('click', function f(){setTimeout(settings_dark, 0)})