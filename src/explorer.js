if (typeof browser === "undefined") {
    browser = chrome
}
browser.storage.local.get({'threads': null}).then((result) => {
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
    browser.storage.local.get(['threads']).then((result) => {
        let t = result.threads
        t.splice(i, 1)
        threads_g = t
        browser.storage.local.set({threads: t})
    });
    row.classList.add('d-none')
}

function export_thread(i){
    browser.storage.local.get(['threads']).then((result) => {
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

let timer;
function searchThreads(threads, searchTerm) { // created by ChatGPT
    searchTerm = searchTerm.toLowerCase();
    return threads.filter(thread => {
        return thread.convo.some(message => message.toLowerCase().includes(searchTerm));
    });
}


function search(){
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
    clearTimeout(timer)
    if (!updated) {
        browser.storage.local.get(['threads']).then((result) => {
            threads_g = result.threads
        });
    }
    updated = true
    timer = setTimeout(() => {updated = false}, 10000)
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
    browser.storage.sync.get({mode: "dark"},
        function(result) {
            dl = result?.mode;
			if(!dl) dl = "dark"; // guard statement because it apparently still returns undefined "result" sometimes 
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
        row.addEventListener('click', event => {
            const target = event.target;
            if (target.classList.contains('trash')){
                delete_thread(i, row)
            }
            else if (target.classList.contains('bookmark')){
                threads[i].favorite = !threads[i].favorite
                browser.storage.local.set({threads: threads})
                let saved = threads[i].favorite
                update_bookmark(btn, saved)
            }
            else if (target.classList.contains('export')) {
                export_thread(i, row);
            } else{
                window.open(link, "_blank")
            }
        });
        main.appendChild(temp)
    }
}
function b_load(){
    document.querySelector('#blink').outerHTML = `<a href="explorer.html" class="mx-3 p-3 text-white text-sm"><i class="fa-solid fa-reel"></i> &emsp; All Threads</a>`
    load_threads(threads_g, false, "", true)
}

function bookmarks() {
    main.innerHTML = ""
    update_threads()
    setTimeout(b_load, 100)
}

function timer_dl(){
    setTimeout(dark_light, 300)
}

function export_all()
{
    browser.storage.local.get(['threads']).then((result) => {
        let t = result.threads;
        let data = {threads:t};
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
		
		// backwards compatability, to be removed 
		if(Array.isArray(data))
		{
			data = {threads:data};
		}
		
		import_threads_from_data(data);
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
	browser.storage.local.get(['threads']).then((result) => {
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
		
		browser.storage.local.set({threads: t});
		
		// we reload the page directly after setting. it'll conveniently reinitialize everything.
		window.location.reload();
	});
}

document.querySelectorAll('.bnav').forEach(item => {item.addEventListener('click', bookmarks)})

document.querySelector('#light_dark').addEventListener('click', timer_dl)

document.querySelector("#export_all").addEventListener('click', export_all)

+document.querySelector("#import_all").addEventListener('change', import_all)