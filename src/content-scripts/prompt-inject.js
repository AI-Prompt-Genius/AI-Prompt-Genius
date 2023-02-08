function main() {
    chrome.storage.local.get({prompts: []}, function (result) {
        let prompts = JSON.stringify(result.prompts)
        document.body.appendChild(document.createElement(`input`)).setAttribute("id", "prompts_storage")
        document.querySelector("#prompts_storage").setAttribute("type", "hidden")
        document.querySelector("#prompts_storage").value = prompts
    })
}

main()

injectScript(chrome.runtime.getURL('content-scripts/prompts.js'), 'body');

/*let url = chrome.runtime.getURL('pages/prompts.html')

setTimeout(() => {
    document.querySelector("#prompt-link").href = url
}, 2000)*/