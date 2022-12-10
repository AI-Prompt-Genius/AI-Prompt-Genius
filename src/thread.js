hljs.highlightAll();
// Get the URL of the current page
const url = new URL(window.location.href);

// Get the value of the "name" parameter in the query string
const thread_num = Number(url.searchParams.get("thread"));

const h_template = document.querySelector("#human")
const b_template = document.querySelector("#bot")

let main = document.querySelector("#main")

chrome.storage.local.get(['threads']).then((result) => {
    let t = result.threads
    let convo = t[thread_num].convo
    console.log(convo)
    load_thread(convo)
})
function load_thread(c){
    console.log(c)
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
}