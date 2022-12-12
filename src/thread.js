hljs.highlightAll();
// Get the URL of the current page
const url = new URL(window.location.href);

// Get the value of the "name" parameter in the query string
const thread_num = url.searchParams.get("thread");

const h_template = document.querySelector("#human")
const b_template = document.querySelector("#bot")

let main = document.querySelector("#main")

function getObjectById(id, list) { // created by ChatGPT
    // Iterate over the list of objects
    for (let i = 0; i < list.length; i++) {
        const obj = list[i];

        // Check if the object has an `id` property that matches the given id
        if (obj.id && obj.id === id) {
            // If a match is found, return the object
            return obj;
        }
    }

    // If no match is found, return null
    return null;
}

chrome.storage.local.get(['threads']).then((result) => {
    let t = result.threads
    let c = getObjectById(thread_num, t)
    let convo;
    if (c === null) {
        convo = t[thread_num].convo
    }
    else{
        convo = c.convo
    }
    load_thread(convo)
})
function load_thread(c){
    for (let i = 0; i < c.length; i++) {
        let human = i % 2 === 0;
        if (human) {
            var temp = h_template.content.cloneNode(true);
            temp.querySelector(".text").innerHTML = `<p>${c[i]}</p>`
            main.appendChild(temp)
        }
        else{
            var temp = b_template.content.cloneNode(true);
            temp.querySelector(".text").innerHTML = c[i]
            main.appendChild(temp)
        }
    }
    copy_setup()
}
function copy_setup() {
    const clipboardBars = document.querySelectorAll('.copy');
    const codeElements = document.querySelectorAll('pre code');


// Add a click event listener to each clipboard bar
    clipboardBars.forEach((clipboardBar, index) => {
        clipboardBar.addEventListener('click', async () => {
            let clipboard = `<i class="fa-regular clipboard fa-clipboard"></i>`
            let copy_bar = `<div class="p-2 copy float-right">${clipboard} &nbsp; Copy code</div>`
            clipboardBar.innerHTML = `<icon class="fa-regular fa-check"></icon> &nbsp; Copied!`;
            setTimeout(() => {clipboardBar.outerHTML = copy_bar}, 2000);
            // Get the code element corresponding to the clicked clipboard bar
            const codeElement = codeElements[index];

            // Get the text content of the code element
            const text = codeElement.textContent;

            // Copy the text to the clipboard
            await navigator.clipboard.writeText(text);
        });
    });

}
