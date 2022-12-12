chrome.storage.local.get(['threads']).then((result) => {
    load_threads(result.threads)
})

let main = document.querySelector(".main")
function sliceString(str, num) { //created by ChatGPT
    // Check if the string is longer than num characters
    if (str.length > num) {
        return `${str.slice(0, num)}...`.replace("<p>", "").replace("</p>", "");
    }
    // If the string is not longer than num characters, return it as is
    return str;
}

function delete_thread(i, row){
    chrome.storage.local.get(['threads']).then((result) => {
        let t = result.threads
        t.splice(i, 1)
        chrome.storage.local.set({threads: t})
    });
    row.classList.add('d-none')
}

let timer;
function searchThreads(threads, searchTerm) { // created by ChatGPT
    return threads.filter(thread => {
        return thread.convo.some(message => message.includes(searchTerm));
    });
}

function search(){
    let search_term = document.querySelector('.search-bar').value
    update_threads()
    let ts = searchThreads(threads_g, document.querySelector('.search-bar').value)
    main.innerHTML = ""
    load_threads(ts, true, search_term)
    if (search_term === ""){
        load_threads(threads_g)
    }
}

document.querySelector('.search-bar').addEventListener('input', search)

let threads_g = []
let updated = false
function update_threads() {
    clearTimeout(timer)
    if (!updated) {
        chrome.storage.local.get(['threads']).then((result) => {
            threads_g = result.threads
        });
    }
    updated = true
    timer = setTimeout(() => {updated = false}, 10000)
}

function update_bookmark(btn, saved){
    if (saved) {
        btn.classList.remove('btn-outline-success')
        btn.classList.add('btn-success')
    }
    else {
        btn.classList.remove('btn-success')
        btn.classList.add('btn-outline-success')
    }
}

function searchList(strings, searchTerm) { // created by ChatGPT
    const matchingStrings = strings.filter(string => string.includes(searchTerm));

    return matchingStrings.map(string => {
        const index = string.indexOf(searchTerm);
        const startIndex = Math.max(0, index - 50);
        const endIndex = Math.min(string.length, index + 50);

        let substring = string.substring(startIndex, endIndex);
        if (startIndex > 0) {
            substring = "..." + substring;
        }
        if (endIndex < string.length) {
            substring = substring + "...";
        }

        return substring.replace(searchTerm, `<span class="highlight">${searchTerm}</span>`);
    }).join(", ");
}

let dl;
dark_light()
async function dark_light() {
    chrome.storage.sync.get({mode: "dark"},
        function(result) {
            dl = result.mode
        }
    )
}

function load_threads(threads, search=false, search_term="", bookmarks=false){
    for (let n = 0; n < threads.length; n++) {
        let i = threads.length - n - 1
        let temp;
        let even = n % 2 === 0;
        if (even) {
            temp = document.querySelector('#even').content.cloneNode(true);
        }
        else {
            temp = document.querySelector('#odd').content.cloneNode(true);
        }
        temp.querySelector('.date').innerHTML = threads[i].date
        temp.querySelector('.time').innerHTML = threads[i].time
        temp.querySelector('.title').innerHTML = sliceString(threads[i].convo[0], 55)
        if (!search && threads[i].convo[1] !== undefined) {
            temp.querySelector('.subtitle').innerHTML = sliceString(threads[i].convo[1], 100)
        }
        else{
            temp.querySelector('.subtitle').innerHTML = sliceString(searchList(threads[i].convo, search_term), 100)
        }
        let saved = threads[i].favorite
        console.log(saved)
        let btn = temp.querySelector('.btn.bookmark')
        update_bookmark(btn, saved)
        let id = threads[i].id
        if (id === undefined) {
            id = i
        }
        let link = `thread.html?thread=${id}`
        let row = temp.querySelector('.row')
        if (bookmarks){
            if (!saved){
                row.classList.add('d-none')
            }
        }
        if (dl === "light") {
            row.classList.remove('dark')
            row.classList.add('light')
        }
        row.addEventListener('click', event => {
            const target = event.target;
            if (target.classList.contains('trash')){
                delete_thread(i, row)
            }
            else if (target.classList.contains('bookmark')){
                threads[i].favorite = !threads[i].favorite
                chrome.storage.local.set({threads: threads})
                let saved = threads[i].favorite
                update_bookmark(btn, saved)
            } else{
                window.open(link, "_blank")
            }
        });
        main.appendChild(temp)
    }
}
function b_load(){
    load_threads(threads_g, false, "", true)
    document.querySelector('#blink').outerHTML = `<a href="explorer.html" class="mx-3 p-3 text-white text-sm"><i class="fa-solid fa-reel"></i> &emsp; All Threads</a>`
}

function bookmarks() {
    main.innerHTML = ""
    update_threads()
    setTimeout(b_load, 100)
}

function timer_dl(){
    setTimeout(dark_light, 300)
}
document.querySelectorAll('.bnav').forEach(item => {item.addEventListener('click', bookmarks)})

document.querySelector('#light_dark').addEventListener('click', timer_dl)