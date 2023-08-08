// Assuming the dependencies have been loaded globally:
function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement("script");
    s.setAttribute("type", "text/javascript");
    s.setAttribute("src", file);
    th.appendChild(s);
}


injectScript(chrome.runtime.getURL("content-scripts/external-chat/inject.js"), "body");

async function* streamAsyncIterable(stream) {
    const reader = stream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                return;
            }
            yield value;
        }
    } finally {
        reader.releaseLock();
    }
}

function uint8Array2String(uint8Array) {
    const decoder = new TextDecoder()
    return decoder.decode(uint8Array)
}

function setupProxyExecutor() {
    // one port for one fetch request
    chrome.runtime.onConnect.addListener((port) => {
        const abortController = new AbortController()
        port.onDisconnect.addListener(() => {
            abortController.abort()
        })
        port.onMessage.addListener(async (message) => {
            console.debug('proxy fetch', message.url, message.options)
            const resp = await fetch(message.url, {
                ...message.options,
                signal: abortController.signal,
            })
            port.postMessage({
                type: 'PROXY_RESPONSE_METADATA',
                metadata: {
                    status: resp.status,
                    statusText: resp.statusText,
                    headers: Object.fromEntries(resp.headers.entries()),
                },
            })
            for await (const chunk of streamAsyncIterable(resp.body)) {
                port.postMessage({
                    type: 'PROXY_RESPONSE_BODY_CHUNK',
                    value: uint8Array2String(chunk),
                    done: false,
                })
            }
            port.postMessage({ type: 'PROXY_RESPONSE_BODY_CHUNK', done: true })
        })
    })
}

function injectTip() {
    const div = document.createElement('div')
    div.innerText = 'Please keep this tab open, now you can go back to AI Prompt Genius'
    div.style.position = 'fixed'
    // put the div at right top of page
    div.style.top = '0'
    div.style.right = '0'
    div.style.zIndex = '50'
    div.style.padding = '10px'
    div.style.margin = '10px'
    div.style.border = '1px solid'
    document.body.appendChild(div)
}

async function main() {
    chrome.runtime.onMessage.addListener(async (message) => {
        if (message === 'url') {
            return location.href
        }
    })
    if (window.__NEXT_DATA__) {
        await chrome.runtime.sendMessage({ event: 'PROXY_TAB_READY' })
        //injectTip()
    }
}

setupProxyExecutor()
main().catch(console.error)