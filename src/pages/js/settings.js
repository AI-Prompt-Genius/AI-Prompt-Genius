if (typeof browser === "undefined") {
    browser = chrome
}
if (typeof firefox !== undefined && firefox === false){
    console.log(document.querySelector('.export').innerHTML)
    document.querySelector('.export').classList.remove('d-none')
}

function update_settings(){
    let buttons = document.querySelector('#exportButtonsToggle').checked
    let autoDelete = document.querySelector('#autoDeleteToggle').checked
    let autoSend = document.querySelector('#autoSendToggle').checked
    let message = document.querySelector('#defaultMessageInput').value
    let homePageIsPrompts = document.querySelector('#default-page').checked
    let disableHistory = document.querySelector('#disable-history').checked
    let visualEditor = document.querySelector('#reddit-editor').checked
    let settings = // sorry the syntax is weird
        {buttons: buttons, auto_send: autoSend, auto_delete: autoDelete, message: message, disable_history: disableHistory, visual_editor: visualEditor, home_is_prompts: homePageIsPrompts}
    browser.storage.local.set({settings: settings})
}
let typingTimer;

function text_delay(){
    clearTimeout(typingTimer)
    typingTimer = setTimeout(update_settings, 500)
}

for (let each of document.querySelectorAll('.form-check-input')){
    each.addEventListener('change', update_settings)
}
document.querySelector('textarea').addEventListener('input', text_delay)

function load_settings(){
    let defaults = {buttons: true, auto_send: true, auto_delete: false, disable_history: false, visual_editor: true, home_is_prompts: true, message: "The following is a transcript of a conversation between me and ChatGPT. Use it for context in the rest of the conversation. Be ready to edit and build upon the responses previously given by ChatGPT. Respond \"ready!\" if you understand the context. Do not respond with anything else. Conversation:\n"}
    browser.storage.local.get({settings: defaults}, function(result) {
        document.querySelector('#exportButtonsToggle').checked = result.settings.buttons
        document.querySelector('#autoDeleteToggle').checked = result.settings.auto_delete
        document.querySelector('#autoSendToggle').checked = result.settings.auto_send
        document.querySelector('textarea').value = result.settings.message
        if (result.settings.home_is_prompts) { // if they don't have these settings, they're on the old version
            document.querySelector('#default-page').checked = result.settings.home_is_prompts
            document.querySelector('#disable-history').checked = result.settings.disable_history
            document.querySelector('#reddit-editor').checked = result.settings.visual_editor
        }
        else {
            document.querySelector('#default-page').checked = false
            document.querySelector('#disable-history').checked = false
            document.querySelector('#reddit-editor').checked = true
        }
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