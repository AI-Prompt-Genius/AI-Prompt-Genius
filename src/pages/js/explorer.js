chrome.storage.local.get({'threads': null}, function (result) {
    if (result.threads !== null) {
        load_threads(result.threads)
    }
    else{
        main.innerHTML = `<h1 class="p-3 m-3 even dark">Welcome! This is where your thread history will appear. To get started, simply start a new ChatGPT conversation.</h1>`
    }
})

let main = document.querySelector(".main")
function sliceString(str, num) { //created by ChatGPT
    // Check if the string is longer than num characters
    if (str.length > num) {
        return `${str.slice(0, num)}...`.replace(`<p>`, "").replace(`</p>`, "");
    }
    // If the string is not longer than num characters, return it as is
    return str;
}

function delete_thread(i, row){
    chrome.storage.local.get(['threads'], function (result) {
        let t = result.threads
        t.splice(i, 1)
        threads_g = t
        chrome.storage.local.set({threads: t})
    });
    row.classList.add('d-none')
}

function toggle_thread_title_editable(i, row){
    let title_text = row.querySelector(".title-text");
    let edit_icon = row.querySelector(".edit-title-button");
    if(title_text.contentEditable === "inherit")
    {
        // if thread.title, import the FULL title into the text if it exists
        chrome.storage.local.get(['threads'], function (result) {
            let t = result.threads
            let thread = t[i];
            if(thread.title) title_text.innerHTML = thread.title;
        });
        title_text.classList.add('editable')
        title_text.contentEditable = "true";
        title_text.focus();
        edit_icon.classList.remove("fa-pen-to-square");
        edit_icon.classList.add("fa-floppy-disk-pen");
    }
    else
    {
        title_text.classList.remove('editable')
        title_text.contentEditable = "inherit";
        // now set the title instead
        chrome.storage.local.get(['threads'], function (result) {
            let t = result.threads
            let thread = t[i];
            thread.title = title_text.innerText;
            chrome.storage.local.set({threads: t});
            threads_g = t;
        });
        edit_icon.classList.remove("fa-floppy-disk-pen");
        edit_icon.classList.add("fa-pen-to-square");
    }
}

function export_thread(i){
    chrome.storage.local.get(['threads'], function (result) {
        let t = result.threads
        let thread = t[i];

        let title = "chatgpt_thread.txt";
        let file = convert_thread_to_JSON_file(thread);
        download_blob_as_file(file, title);
    });
}

function encode_string_as_blob(string)
{
    let bytes = new TextEncoder().encode(string);
    let blob = new Blob([bytes], {
        type: "application/json;charset=utf-8"
    });
    return blob;
}

// basially using the fileSaver.js, it's an IIFE to save on implementing the <a> singleton.
const download_blob_as_file = (function()
{
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (blob, file_name)
    {
        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = file_name;
        a.click();
        window.URL.revokeObjectURL(url);
    }
})();

/* conversion functions for export and download */
function convert_thread_to_JSON_file(thread)
{
    let data = thread;
    let string = JSON.stringify(data);
    let blob = encode_string_as_blob(string);
    return blob;
}

function convert_thread_to_text_file(thread)
{
    let string = "Date:" + thread.date + " " + thread.time + "\n";
    let convo = thread.convo;
    for(let i = 0; i < convo.length; i++)
    {
        let speaker = i % 2 === 0 ? "Human" : "Assistant";
        string += speaker + ": " + convo[i] + "\n";
    }
    let blob = encode_string_as_blob(string);
    return blob;
}

function convert_thread_to_markdown_file(thread)
{
    let string = "";
    string += "# " + "ChatGPT Conversation" + "\n";
    string += "Date:" + thread.date + " " + thread.time + "\n";
    string += "\n"; // two newlines because MD is like that
    let convo = thread.convo;
    for(let i = 0; i < convo.length; i++)
    {
        let speaker = i % 2 === 0 ? "Human" : "Assistant";
        string += "### " + speaker + "\n";
        string += convo[i] + "\n";
        string += "\n";
    }
    let blob = encode_string_as_blob(string);
    return blob;
}

let timer;
function searchThreads(threads, searchTerm) { // created by ChatGPT
    searchTerm = searchTerm.toLowerCase();
    return threads.filter(thread => {
        return (
            thread.convo.some(message => message.toLowerCase().includes(searchTerm)) ||
            (thread.title && thread.title.toLowerCase().includes(searchTerm))
        );
    });
}


function search() {
    let search_term = document.querySelector('.search-bar').value
    update_threads()
    let ts = searchThreads(threads_g, document.querySelector('.search-bar').value)
    main.innerHTML = ""
    if (search_term === ""){
        load_threads(threads_g)
    }
    else {
        load_threads(ts, true, search_term)
    }
}

document.querySelector('.search-bar').addEventListener('input', search)

let threads_g = []
let updated = false
function update_threads() {
    chrome.storage.local.get(['threads'], function (result) {
        threads_g = result.threads
    });
}
update_threads()

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
    searchTerm = searchTerm.toLowerCase();
    const matchingStrings = strings.filter(string => string.toLowerCase().includes(searchTerm));

    return matchingStrings.map(string => {
        const index = string.toLowerCase().indexOf(searchTerm);
        const startIndex = Math.max(0, index - 50);
        const endIndex = Math.min(string.length, index + 50);

        let substring = string.substring(startIndex, endIndex);
        if (startIndex > 0) {
            substring = "..." + substring;
        }
        if (endIndex < string.length) {
            substring = substring + "...";
        }

        // use the original case of the search term when highlighting it
        const searchTermRegex = new RegExp(searchTerm, "gi");
        return substring.replace(searchTermRegex, `<span class="highlight">$&</span>`);
    }).join(", ");
}



let dl;
dark_light()
async function dark_light() {
    chrome.storage.local.get({mode: "dark"},
        function(result) {
            dl = result?.mode;
            if(!dl) dl = "dark"; // guard statement because it apparently still returns undefined "result" sometimes
        }
    )
}

const MAX_TITLE_DISPLAY_LENGTH = 55;

function load_threads(threads, search=false, search_term="", bookmarks=false) {
    let threadsLoaded = []
    for (let n = 0; n < threads.length; n++) {
        let i = threads.length - n - 1;
        let temp;
        let even = n % 2 === 0;
        if (even) {
            temp = document.querySelector('#even').content.cloneNode(true);
        }
        else {
            temp = document.querySelector('#odd').content.cloneNode(true);
        }
        temp.querySelector('.date').innerHTML = threads[i].date;
        temp.querySelector('.time').innerHTML = threads[i].time;

        let thread_title = threads[i].title;
        if(!thread_title) thread_title = sliceString(threads[i].convo[0], MAX_TITLE_DISPLAY_LENGTH);
        if(thread_title.length > MAX_TITLE_DISPLAY_LENGTH) thread_title = sliceString(thread_title, MAX_TITLE_DISPLAY_LENGTH);

        temp.querySelector('.title-text').innerHTML = thread_title;

        if (!search && threads[i].convo[1] !== undefined) {
            temp.querySelector('.subtitle').innerHTML = sliceString(threads[i].convo[1], 100)
        }
        else{
            temp.querySelector('.subtitle').innerHTML = sliceString(searchList(threads[i].convo, search_term), 100)
            temp.querySelector('.title-text').innerHTML = sliceString(searchList([thread_title], search_term), 100)
            if (temp.querySelector('.title-text').innerHTML === "") {
                temp.querySelector('.title-text').innerHTML = thread_title
            }
        }
        let saved = threads[i].favorite
        let btn = temp.querySelector('.btn.bookmark')
        update_bookmark(btn, saved)
        let id = threads[i].id
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
        let title_input = row.querySelector('.title-text')
        title_input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                toggle_thread_title_editable(i, row)
            }
        });
        row.addEventListener('click', event => {
            const target = event.target;
            if (target.classList.contains('trash')){
                delete_thread(i, row)
            }
            else if (target.classList.contains('edit-title-button')){
                toggle_thread_title_editable(i, row);
            }
            else if (target.classList.contains('title-text')){
                // solely catch a do-nothing
            }
            else if (target.classList.contains('bookmark')){
                threads[i].favorite = !threads[i].favorite
                chrome.storage.local.set({threads: threads})
                let saved = threads[i].favorite
                update_bookmark(btn, saved)
            }
            else if (target.classList.contains('export')) {
                export_thread(i, row);
            }
            else if(target.classList.contains('continue')) {
                let c = [];
                console.log(threads[i])
                console.log(threads[i].hasOwnProperty('unified_id'))
                if (threads[i].hasOwnProperty('unified_id') && threads[i].unified_id === true) {
                    console.log("unified")
                    window.open(`https://chat.openai.com/chat/${threads[i].id}`, '_blank');
                }
                else {
                    for (let i = 0; i < threads[i].convo.length; i++) {
                        let user = i % 2 === 0 ? "Me" : "ChatGPT";
                        c.push({[user]: htmlToPlainText(threads[0].convo[i])});
                    }

                    chrome.runtime.sendMessage({convo: c, type: 'b_continue_convo'})
                }
            }
            else{
                window.open(link, "_blank")
            }
        });
        //if (!threadsLoaded.includes(id)) {
            main.appendChild(temp);
        //}
        threadsLoaded.push(id)
    }
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
}

function b_load(){
    document.querySelector('#blink').outerHTML = `<a href="explorer.html" class="mx-3 p-3 text-white text-sm"><i class="fa-solid fa-reel"></i> &emsp; All Threads</a>`
    load_threads(threads_g, false, "", true)
}

function bookmarks() {
    main.innerHTML = ""
    update_threads()
    setTimeout(b_load, 50)
}

function timer_dl(){
    setTimeout(dark_light, 300)
}

// these are now "general" export import functions
// TODO: export and import settings as well
function export_all()
{
    chrome.storage.local.get(['threads','prompts', 'settings'], function (result) {
        let t = result.threads;
        let prompts = result.prompts;
        let settings = result.settings

        let data = {threads:t, prompts:prompts, settings:settings};

        let string = JSON.stringify(data);
        let blob = encode_string_as_blob(string);
        let currentTimeString = (new Date()).toJSON();
        let filename = "ChatGPT-History" + "_" + currentTimeString + ".txt";
        download_blob_as_file(blob, filename);
    });
}

function import_all()
{
    let input = document.querySelector("#import_all");
    let file = input.files[0];
    if(!file)
    {
        console.warn(`unable to find a valid file`);
        return;
    }

    let reader = new FileReader();
    reader.onload = function(event)
    {
        let string = event.target.result;
        let data = JSON.parse(string);

        // backwards compatability
        if(Array.isArray(data))
        {
            data = {threads:data};
        }

        import_threads_from_data(data);
        import_prompts_from_data(data);
        import_settings_from_data(data);
    }
    reader.onerror = function(event)
    {
        console.log(`Error occured in file reader: `);
        console.log(event);
    }
    reader.readAsText(file);
}

// takes an object that looks like {threads:data[]}
function import_threads_from_data(data) {
    chrome.storage.local.get(['threads'], function (result) {
        console.log(`Importing threads...`);
        let t = result.threads;

        // empty case
        if(!t) t = [];

        // validate each thread before adding
        let new_t = data.threads;
        for(let i = 0, len = new_t.length; i < len; i++) {
            let thread = new_t[i];
            let id = thread.id;

            // in case there is no ID, we have to use a simpler heuristic.
            // if date and convo is the same, for all intents and purposes it is the same, bookmark/id don't matter.
            if(!id) {
                // if found duplicate, then do nothing
                if(get_thread_in_list_deep_equals(thread, t)) {
                    continue;
                }
                else {
                    // otherwise, it is completely original; give the thread a random new ID
                    thread.id = generateUUID();
                }
            }

            // If the ID is the same as one of our own, that means it is the same thread and we should ignore it.
            if(id && getObjectById(id, t) !== null) {
                continue;
            }

            t.push(thread);
        }

        chrome.storage.local.set({threads: t});

        threads_g = t;
        main.innerHTML = ""; //todo, refactor this into load_threads(t)
        load_threads(t);
    });
}
function import_settings_from_data(data) {
    console.log(data)
    if (data.settings) {
        chrome.storage.local.set({settings: data.settings});
    }
}

function import_prompts_from_data(data) {
    chrome.storage.local.get(['prompts'], function (result) {
        console.log(`Importing prompts...`);

        let prompts = result.prompts;
        if(!prompts){
            prompts = [];
            broswer.storage.local.set({seen_v2_toast: true})
        }

        let new_prompts = data.prompts;

        for(let i = 0, len = new_prompts.length; i < len; i++) {
            let prompt = new_prompts[i];
            let id = prompt.id;

            // If the ID is the same as one of our own, ignore it.
            // thankfully, all prompts have IDs
            if(id && getObjectById(id, prompts) !== null) {
                continue;
            }

            prompts.push(prompt);
        }

        chrome.storage.local.set({prompts: prompts});
    });
}

chrome.storage.local.get({threads:"none"}, function(result) {
  if (result.threads === "none"){ // new user
      chrome.storage.local.set({seen_v2_toast: true})
      chrome.storage.local.get({settings: {home_is_prompts: true}}, function (response){
          let settings = response.settings;
          settings.home_is_prompts = true;
          chrome.storage.local.set({settings: settings})})
  }
  else {
      chrome.storage.local.get({seen_v2_toast: false}, function (response){
          let seen_v2_toast = response.seen_v2_toast;
          if (!seen_v2_toast) {
              chrome.storage.local.set({seen_v2_toast: true})
              let toastEl = document.getElementById('liveToast')
              let toast = new bootstrap.Toast(toastEl)
              toast.show()
              chrome.storage.local.get({settings: {home_is_prompts: true}}, function (response){
                  let settings = response.settings;
                  settings.home_is_prompts = true;
                  chrome.storage.local.set({settings: settings})
              })
          }
      })
  }
})

document.querySelectorAll('.bnav').forEach(item => {item.addEventListener('click', bookmarks)})

document.querySelector('#light_dark').addEventListener('click', timer_dl)

document.querySelector("#export_all").addEventListener('click', export_all)

document.querySelector("#import_all").addEventListener('change', import_all)
