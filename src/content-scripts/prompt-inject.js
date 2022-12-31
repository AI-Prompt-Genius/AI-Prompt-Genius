if (typeof browser === "undefined"){
    browser = chrome;
}
function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}
function main() {
    browser.storage.local.get({prompts: []}).then((result) => {
        let prompts = JSON.stringify(result.prompts)
        document.body.appendChild(document.createElement(`input`)).setAttribute("id", "prompts_storage")
        document.querySelector("#prompts_storage").setAttribute("type", "hidden")
        document.querySelector("#prompts_storage").value = prompts
    })
}
main()

injectScript(browser.runtime.getURL('content-scripts/prompts.js'), 'body');

/*let url = browser.runtime.getURL('pages/prompts.html')

setTimeout(() => {
    document.querySelector("#prompt-link").href = url
}, 2000)*/