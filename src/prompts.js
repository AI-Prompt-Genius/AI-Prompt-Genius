if (typeof browser === "undefined") {
    browser = chrome
}

let main = document.querySelector("main");

// boilerplate
let dl;
dark_light()
async function dark_light() {
    browser.storage.local.get({mode: "dark"},
        function(result) {
            dl = result?.mode;
			if(!dl) dl = "dark"; // guard statement because it apparently still returns undefined "result" sometimes 
        }
    )
}

// default prompts for new users
const default_prompts = [
	{
		"title": "George R. R. Martin Author",
		"text": `Write using the above prompt. 
Write in the style of George. R. R. Martin and the Game of Thrones books. Use his words and style of diction. Always write in that style.
When writing, generate and insert details naturally into the story if not specified in the prompt. Always generate names for people and places if not specified. Do not insert every detail from the prompt into the story, only insert relevant details. When inserting details, use your own words. 
Write the first scene.
`,
		"id": generateUUID(),
		"date": getDate(),
		"time": getTime(),
	}
];

const keys_pressed = {
	"shift": false,
};

browser.storage.local.get({prompts: default_prompts}, function(result) {
	load_prompts(result.prompts);
});

function load_prompts(prompts)
{
	main.innerHTML = "";
	for (let n = prompts.length - 1; n > -1; n--) { // load in reverse order
		let template = document.querySelector('#prompt_template').content.cloneNode(true);
		let even = n % 2 === 0;
		
		let prompt = prompts[n];
		let id = prompt.id;
		
		template.querySelector('.date').innerHTML = prompt.date;
        template.querySelector('.time').innerHTML = prompt.time;
        let title_text = template.querySelector('.title-text');
		title_text.innerHTML = prompt.title;
        let prompt_text = template.querySelector('.prompt-text');
		prompt_text.innerHTML = prompt.text;
		let row = template.querySelector('.row');
		
		if(even)
		{
			row.classList.add("even");
		}
		else 
		{
			row.classList.add("odd");
		}
        if (dl === "light") {
            row.classList.remove('dark')
            row.classList.add('light')
        }
		
		
		row.addEventListener('click', event => {
            const target = event.target;
			if (target.classList.contains('trash')){
                delete_prompt(id);
            }
			else if(target.classList.contains('continue')){
				use_prompt(id);
            }
			else if (target.classList.contains('edit-button')){
				toggle_prompt_editable(id, row);
			}
			else if (target.classList.contains('prompt-text')){
				toggle_prompt_editable(id, row);
			}
			else if (target.classList.contains('title-text')){
				// Catchall
			}
			else {
				
			}
		});
		/*
		prompt_text.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				if(!keys_pressed['shift'])
				{
					toggle_prompt_body_editable(id, row);
				}
			}
		});
		*/
		main.appendChild(template);
	};
}

function delete_prompt(id)
{
	browser.storage.local.get({prompts: default_prompts}).then((result) => {
		let prompts = result.prompts;
		let prompt = getObjectById(id, prompts);
		if(!prompt)
		{
			console.warn(`toggle_prompt_editable: cannot find prompt of id ${id}.`);
			return;
		}
		removeElementInArray(prompts, prompt);
		browser.storage.local.set({prompts: prompts});
		load_prompts(prompts);
	});
}

function use_prompt(id)
{
	browser.storage.local.get({prompts: default_prompts}).then((result) => {
		let prompts = result.prompts;
		let prompt = getObjectById(id, prompts);
		if(!prompt)
		{
			console.warn(`toggle_prompt_editable: cannot find prompt of id ${id}.`);
			return;
		}
		chrome.runtime.sendMessage({prompt: prompt.text, type: 'b_use_prompt'})
	});
}

function toggle_prompt_title_editable(id, element)
{
	//getObjectById(id, list)
}

function toggle_prompt_editable(id, element)
{
	let edit_icon = element.querySelector(".edit-button");
	let prompt_title =  element.querySelector(".title-text");
	let prompt_text = element.querySelector(".prompt-text");
	
	if(!prompt_text.querySelector("textarea"))
	{
		let textarea = document.createElement("textarea");
		prompt_text.innerHTML = "";
		prompt_text.appendChild(textarea);
		browser.storage.local.get({prompts: default_prompts}).then((result) => {
			let prompts = result.prompts;
			let prompt = getObjectById(id, prompts);
			if(!prompt)
			{
				console.warn(`toggle_prompt_editable: cannot find prompt of id ${id}.`);
				return;
			}
			textarea.value = prompt.text;
			prompt_title.innerHTML = prompt.title; // load full titles from truncated
			// init
			autoExpandTextArea();
		});
		// update buttons
		edit_icon.classList.remove("fa-pen-to-square");
		edit_icon.classList.add("fa-floppy-disk-pen");
		// make title editable
		prompt_title.classList.add('editable')
		prompt_title.contentEditable = "true";
		prompt_title.focus();
		
		// automatically growing textarea 
		const autoExpandTextArea = function() {
			textarea.style.height = ""; /* Reset the height*/
			textarea.style.height = textarea.scrollHeight + "px";
		}
		textarea.oninput = autoExpandTextArea;
	}
	else 
	{
		let textarea = prompt_text.querySelector("textarea");
		let text = textarea.value;
		browser.storage.local.get({prompts: default_prompts}).then((result) => {
			let prompts = result.prompts;
			let prompt = getObjectById(id, prompts);
			if(!prompt)
			{
				console.warn(`toggle_prompt_editable: cannot find prompt of id ${id}.`);
				return;
			}
			prompt.text = text;
			prompt.title = prompt_title.innerText;
			browser.storage.local.set({prompts: prompts});
		});
		// make title uneditable
		prompt_title.classList.remove('editable')
		prompt_title.contentEditable = "inherit";
		
		prompt_text.innerHTML = text;
		// update buttons
		edit_icon.classList.add("fa-pen-to-square");
		edit_icon.classList.remove("fa-floppy-disk-pen");
	}
}

function new_empty_prompt()
{
	let prompt = {
		date: getDate(),
		time: getTime(),
		id: generateUUID(),
		title: "Untitled Prompt",
		text: "",
	};
	browser.storage.local.get({prompts: default_prompts}).then((result) => {
		let prompts = result.prompts;
		prompts.push(prompt);
		browser.storage.local.set({prompts: prompts});
		load_prompts(prompts);
	});
	return prompt;
}

function handle_keydown(event)
{
	if(event.key === "Shift")
	{
		keys_pressed["Shift"] = true;
	}
}

function handle_keyup(event)
{
	if(event.key === "Shift")
	{
		keys_pressed["Shift"] = false;
	}
}

document.body.addEventListener("keydown", handle_keydown);

document.body.addEventListener("keyup", handle_keyup);

document.querySelector("#new_prompt_button").addEventListener('click', new_empty_prompt)


document.querySelector('#light_dark').addEventListener('click', timer_dl);
function timer_dl(){
    setTimeout(dark_light, 300)
}
