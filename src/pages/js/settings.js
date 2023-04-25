function update_settings(){
    let buttons = document.querySelector('#exportButtonsToggle').checked
    let autoDelete = document.querySelector('#autoDeleteToggle').checked
    let autoSend = document.querySelector('#autoSendToggle').checked
    let message = document.querySelector('#defaultMessageInput').value
    let homePageIsPrompts = document.querySelector('#default-page').checked
    let disableHistory = document.querySelector('#disable-history').checked
    let visualEditor = document.querySelector('#reddit-editor').checked
    let ctrlSave = document.querySelector('#ctrlSave').checked
    let dontInject = document.querySelector("#disable-prompt-injection").checked
    let isPlus = document.querySelector("#chatgpt-plus").checked
    let settings = // sorry the syntax is weird
        {buttons: buttons, dont_inject_prompts: dontInject, is_plus: isPlus, ctrl_save: ctrlSave, auto_send: autoSend, auto_delete: autoDelete, message: message, disable_history: disableHistory, visual_editor: visualEditor, home_is_prompts: homePageIsPrompts}
    //console.log(settings)
    chrome.storage.local.set({settings: settings})
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
    let defaults = {buttons: true, is_plus: false, auto_send: true, auto_delete: false, dont_inject_prompts: false, ctrl_save: false, disable_history: false, visual_editor: true, home_is_prompts: true, message: "The following is a transcript of a conversation between me and ChatGPT. Use it for context in the rest of the conversation. Be ready to edit and build upon the responses previously given by ChatGPT. Respond \"ready!\" if you understand the context. Do not respond with anything else. Conversation:\n"}
    chrome.storage.local.get({settings: defaults}, function(result) {
        //console.log(result)
        document.querySelector('#exportButtonsToggle').checked = result.settings.buttons ?? true
        document.querySelector('#autoDeleteToggle').checked = result.settings.auto_delete ?? false
        document.querySelector('#autoSendToggle').checked = result.settings.auto_send ?? false
        document.querySelector('textarea').value = result.settings.message ?? ""
        document.querySelector('#ctrlSave').checked = result.settings.ctrl_save ?? false
        document.querySelector('#default-page').checked = result.settings.home_is_prompts ?? true
        document.querySelector('#disable-history').checked = result.settings.disable_history ?? false
        document.querySelector('#reddit-editor').checked = result.settings.visual_editor ?? false
        document.querySelector("#disable-prompt-injection").checked = result.settings.dont_inject_prompts ?? false
        document.querySelector("#chatgpt-plus").checked = result.settings.is_plus ?? false
    })
    chrome.storage.local.get({lang: "en"}, function (response){
         document.getElementById("selectLang").value = response.lang
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

function changeLang(){
    let langSelect = document.getElementById("selectLang")
    chrome.storage.local.set({lang: langSelect.value})
    location.reload()
}

setTimeout(settings_dark, 50)
document.body.querySelector('#light_dark').addEventListener('click', function f(){setTimeout(settings_dark, 0)})
document.getElementById("selectLang").addEventListener("change", changeLang)