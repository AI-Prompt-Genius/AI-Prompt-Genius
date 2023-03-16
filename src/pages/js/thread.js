// Get the URL of the current page
const url = new URL(window.location.href);

// Get the value of the "name" parameter in the query string
const thread_id = url.searchParams.get("thread");

const h_template = document.querySelector("#human")
const b_template = document.querySelector("#bot")

let main = document.querySelector("#main");
let branch_state;
let convo; let thread;
chrome.storage.local.get(['threads'], function (result) {
    let t = result.threads
	thread = getObjectById(thread_id, t)
	console.log(thread)
	convo = thread.convo;
	// some of the older threads don't have a branch_state object. 
	let b = thread.branch_state;
	if(!b)
	{
		console.log(`Cannot find branch state, loading convo instead...`);
		load_thread(convo);
	}
	else 
	{
		console.log(`Loading branch state...`);
		branch_state = new TreeNode();
		branch_state.fromJSON(b);
		console.log(branch_state);
		load_branched_thread();
	}
	hljs.highlightAll();
	let blocks = document.querySelectorAll('pre code.hljs');
	Array.prototype.forEach.call(blocks, function(block) {
		let language = block.result.language;
		let copyBar;
		if (block.parentElement.tagName === "DIV") {
			copyBar = block.parentElement.parentElement.querySelector(".copy")
		}
		else {
			copyBar = block.parentElement.querySelector(".copy")
		}
		console.log(block.parentElement)
		console.log(copyBar)
		if (copyBar) {
			copyBar.insertAdjacentHTML("afterbegin", `<span style="float: left"> ${language}</span>`)
		}
	});
});

function load_thread(c){
    for (let i = 0; i < c.length; i++) {
        let human = i % 2 === 0;
        let bar = `<div class="flex items-center relative text-gray-200 bg-gray-800 px-4 py-2 text-xs font-sans"><button class="flex ml-auto gap-2"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>Copy code</button></div>`
		if (human) {
            var temp = h_template.content.cloneNode(true);
            temp.querySelector(".text").innerHTML = `<p>${c[i]}</p>`
            main.appendChild(temp)
        }
        else{
            var temp = b_template.content.cloneNode(true);
            let clipboard = `<i class="fa-regular clipboard fa-clipboard"></i>`
            let copy_bar = `<div class="p-2 copy float-right">${clipboard} &nbsp; Copy code</div>`
            temp.querySelector(".text").innerHTML = c[i].replaceAll(bar, copy_bar).replaceAll(`<div class="p-4">`, "<div>") // fixes formatting for weird code divs
            main.appendChild(temp)
        }
    }
    copy_setup();
}

function load_branched_thread()
{
	// reset 
	main.innerHTML = "";
	
	let fake_convo = branch_state.getCurrentData();
	let current_leaf = branch_state;

	// first element is always null as the head node
	if(fake_convo[0] === null || fake_convo[0] === undefined)
	{
		fake_convo.shift(); 
	}
	else 
	{
		console.warn(`load_branched_thread: data is malformed, weird things are going to happen.`);
	}
	
	for (let i = 0; i < fake_convo.length; i++) {
		let human = i % 2 === 0;
        let bar = `<div class="flex items-center relative text-gray-200 bg-gray-800 px-4 py-2 text-xs font-sans"><button class="flex ml-auto gap-2"><svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>Copy code</button></div>`
		
		let current_leaf_index;
		let leaves_length = 0;
		
		let data_parent_leaf = current_leaf;
		
		if(current_leaf)
		{
			leaves_length = current_leaf.getNumberOfLeaves();
			current_leaf_index = current_leaf.getCurrentLeafIndex();
			// update for next loop iter 
			current_leaf = current_leaf.getCurrentLeaf();
		}
		// set text 
		var temp;
		if(human) {
			temp = h_template.content.cloneNode(true);
		}
		else {
			temp = b_template.content.cloneNode(true);
		}
		
		
		if(leaves_length > 1)
		{
			// temp.querySelector(".branch").innerHTML = `<div class="text-xs flex items-center justify-center gap-1 invisible absolute left-0 top-2 -ml-4 -translate-x-full group-hover:visible"><button class="dark:text-white disabled:text-gray-300 dark:disabled:text-gray-400"><svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="15 18 9 12 15 6"></polyline></svg></button><span class="flex-grow flex-shrink-0">${current_leaf_index+1} / ${leaves_length}</span><button disabled="" class="dark:text-white disabled:text-gray-300 dark:disabled:text-gray-400"><svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="9 18 15 12 9 6"></polyline></svg></button></div>`;
			
			let branchSelectorElement = temp.querySelector(".branch");
			
			// can't go left of 0
			let buttonLeft = document.createElement("button");
			buttonLeft.onclick = () => 
			{
				data_parent_leaf.decrementCurrentLeafIndex();
				load_branched_thread();
			};
			buttonLeft.innerHTML = `<i class="fa-regular fa-angle-left"></i>`;
			branchSelectorElement.appendChild(buttonLeft);
			if((current_leaf_index <= 0))
			{
				buttonLeft.disabled = true;
			}
			
			let branchText = document.createElement("span");
			branchText.classList.add("flex-grow");
			branchText.classList.add("flex-shrink-0");
			branchText.innerHTML = `${current_leaf_index+1} / ${leaves_length}`;
			branchSelectorElement.appendChild(branchText);
			
			// can't go right of max 
			let buttonRight = document.createElement("button");
			buttonRight.onclick = () => 
			{
				data_parent_leaf.incrementCurrentLeafIndex();
				load_branched_thread();
			};
			buttonRight.innerHTML = `<i class="fa-regular fa-angle-right"></i>`;
			branchSelectorElement.appendChild(buttonRight);
			if((current_leaf_index >= leaves_length - 1))
			{
				buttonRight.disabled = true;
			}
		}
		
		if (fake_convo[i] === undefined) {
			temp.querySelector(".text").innerHTML = `<div class="blue-info-box">No data available for current branch.</div>`
			main.appendChild(temp)
		}
		else {
			console.log(thread.mkdwn)
			if (human) {
				let text = fake_convo[i].replaceAll(`<`, `&lt;`).replaceAll(`>`, `&gt;`);
				console.log(text)
				temp.querySelector(".text").innerHTML = `<p>${text}</p>`
				main.appendChild(temp)
			}
			else {
				if (thread.mkdwn) { // markdown to html
					const clipboard = `<i class="fa-regular clipboard fa-clipboard"></i>`
					const copy_bar = `<div class="p-2 copy float-right">${clipboard} &nbsp; Copy code</div>`
					const options = {backslashEscapesHTMLTags: true, tables: true, simplifiedAutoLink: true}
					let converter = new showdown.Converter(options);
					let markdown = fake_convo[i];
					let codeBlockRegex = /```(?<!\\)\n[\s\S]*?\n```/g; //thanks ChatGPT

					// Replace code blocks with HTML elements
					let html = converter.makeHtml(markdown.replace(codeBlockRegex, (match) => {
						// Extract the language if it is specified
						let language = match.match(/```(\w+)/);
						language = language ? language[1] : null;

						// Remove the opening and closing ``` lines plus the /n
						let code = match.slice(4, -3);

						// Highlight the code using hljs
						let highlightedCode = hljs.highlightAuto(code, [language]).value;

						return `<pre>${copy_bar}<code class="!whitespace-pre p-3 hljs ${language}">${highlightedCode}</code></pre>`;
					}));

					temp.querySelector(".text").innerHTML = html;


					main.appendChild(temp)
					console.log(fake_convo[i])
					console.log(html)
				}
				else{ // already html
					let clipboard = `<i class="fa-regular clipboard fa-clipboard"></i>`;
					let copy_bar = `<div class="p-2 copy float-right">${clipboard} &nbsp; Copy code</div>`;
					temp.querySelector(".text").innerHTML = fake_convo[i].replaceAll(bar, copy_bar).replaceAll(`<div class="p-4">`, "<div>") // fixes formatting for weird code divs
					main.appendChild(temp)
				}
			}
		}
	}

	// add buttons.
	copy_setup();
}

// Add the right event listeners for the little copy clipboard in code blocks.
function copy_setup() { // created by ChatGPT
    const clipboardBars = document.querySelectorAll('.copy');
    const codeElements = document.querySelectorAll('pre code');

// Add a click event listener to each clipboard bar
    clipboardBars.forEach((clipboardBar, index) => {
        clipboardBar.addEventListener('click', async () => {
            let copy_bar = clipboardBar.outerHTML
            clipboardBar.innerHTML = `<icon class="fa-regular fa-check"></icon> &nbsp; Copied!`;
            setTimeout(() => {clipboardBar.outerHTML = copy_bar; copy_setup()}, 2000);
            // Get the code element corresponding to the clicked clipboard bar
            const codeElement = codeElements[index];

            // Get the text content of the code element
            const text = codeElement.textContent;

            // Copy the text to the clipboard
            await navigator.clipboard.writeText(text);
        });
    });
}

function getInnerText(className, propertyName) {
    // Get all elements with the given class name
    const elements = document.getElementsByClassName(className);

    // Initialize an empty array to store the inner text of each element
    const innerTextArray = [];

    // Iterate over the elements and add their inner text to the array
    for (let i = 0; i < elements.length; i++) {
        innerTextArray.push({ [propertyName]: elements[i].innerText });
    }

    // Return the array
    return innerTextArray;
}
function alternateValues(array1, array2) {
    return array1.map((val, i) => (i % 2 === 0) ? val : array2[i]);
}

// Open a new thread on a new instance of ChatGPT
function continue_thread(){
	let c = [];
	if (thread.hasOwnProperty('unified_id') && thread.unified_id === true) {
		console.log("unified")
		window.open(`https://chat.openai.com/chat/${thread_id}`, '_blank');
	}
	else {
		for (let i = 0; i < convo.length; i++) {
			let user = i % 2 === 0 ? "Me" : "ChatGPT";
			c.push({[user]: htmlToPlainText(convo[i])});
		}
		chrome.runtime.sendMessage({convo: c, type: 'b_continue_convo'});
	}
}

document.querySelector("#continue").addEventListener("click", continue_thread);