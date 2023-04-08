let main = document.querySelector(".main");
const modal = new bootstrap.Modal(document.getElementById('exploreModal'))

const default_prompts = [
	{
		"title": "My First Demo Prompt",
		"text": `Write a set of clear and concise instructions for creating effective prompts using ChatGPT. Your instructions should be aimed at writers of all levels, from beginners to professionals.

Consider the following questions as you write your instructions:

- What is the purpose of a good writing prompt?
- How can ChatGPT be used to generate effective prompts?
- What elements should be included in a good writing prompt, such as tone, voice, and genre?
- How can writers use prompts to improve their writing skills and creativity?
Your instructions should be easy to follow and understand, using plain language and avoiding technical jargon. Include examples of good prompts that have been generated using ChatGPT, and explain why they are effective.`,
		"id": "examplePrompt",
		"date": getDate(),
		"time": getTime(),
		"tags": ["example", "prompt engineering"],
		"category": "Other"
	},
];

const keys_pressed = {
	"shift": false,
};

let user_prompts = [];

chrome.storage.local.get({prompts: default_prompts}, function(result) {
	user_prompts = result.prompts;
	load_prompts(user_prompts);
});

// sets up toggle for control save behavior
let ctrlSave = false;
chrome.storage.local.get({settings: {ctrlSave: false}}, function(result){
	ctrlSave = result.settings.ctrl_save;
})

function searchString(string, searchTerm) {
	// use the original case of the search term when highlighting it
	const searchTermRegex = new RegExp(searchTerm, "gi");
	return string.replace(searchTermRegex, `<span class="highlight">$&</span>`);
}

let allTags = [];
let alteredOldPrompts = false; // this is due to saving old tags as string
function load_prompts(prompts, search=false, search_term="", tagList=[])
{
	main.innerHTML = "";
	let theme =	main.classList[1];
	console.log(tagList)
	for (let n = prompts.length - 1; n > -1; n--) { // load in reverse order
		let template = document.querySelector('#prompt_template').content.cloneNode(true);
		let even = n % 2 === 0;

		let prompt = prompts[n];
		let id = prompt.id;

		//template.querySelector('.date').innerHTML = prompt.date;
        //template.querySelector('.time').innerHTML = prompt.time;
		let prompt_text = template.querySelector('.prompt-text');
		let title_text = template.querySelector('.title-text');
		if (!search) {
			title_text.innerHTML = prompt.title;
			prompt_text.innerHTML = prompt.text;
		}
		else {
			title_text.innerHTML = searchString(prompt.title, search_term);
			prompt_text.innerHTML = searchString(prompt.text, search_term);
			if (template.querySelector('.title-text').innerHTML === "") {
				template.querySelector('.title-text').innerHTML = prompt.title
			}
			if (template.querySelector('.prompt-text').innerHTML === "") {
				template.querySelector('.prompt-text').innerHTML = prompt.text
			}
		}
		if (prompt.category){
			template.querySelector('.select').value = prompt.category;
		}
		let row = template.querySelector('.row');
		row.id = id

		if(even) {
			row.classList.add("even");
		}
		else {
			row.classList.add("odd");
		}
		row.classList.remove('dark' || 'light');
		row.classList.add(`${theme}`);

		if (typeof prompt.tags === "string"){
			prompt.tags = []
			alteredOldPrompts = true
		}

		for (let tag of prompt.tags ?? []){
			let tags = row.querySelector(".tags")
			let selected = ""
			if (tagList.includes(tag)){
				selected = "selected"
			}
			tags.insertAdjacentHTML("beforeend",`<span class="tag ${selected}">${tag}</span>`)
			if (!allTags.includes(tag)){
				allTags.push(tag)
			}
		}

		let title_input = row.querySelector('.title-text')
		title_input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				if (row.querySelector('textarea')) {
					let empty_body = row.querySelector('textarea').value === "";
					toggle_prompt_editable(id, row, empty_body)
				}
			}
		});

		let tagsInput = row.querySelector(".addTags")
		tagsInput.addEventListener('keydown', (event) => {
			if (event.key === "Enter" && row.querySelectorAll(".autocomplete-active").length === 0){
				addTag(id, row)
			}
		})

		let categorySelect = row.querySelector('.select');
		categorySelect.addEventListener('change', (event) => {
			choose_category(id, row);
		})
		categorySelect.addEventListener('click', () =>{
			if (row.querySelector('textarea')) {
				toggle_prompt_editable(id, row);
			}
		})


		row.addEventListener('click', event => {
            const target = event.target;
			if (target.classList.contains('trash')){
				hideAllTooltips(row)
                delete_prompt(id);
            }
			else if(target.classList.contains('continue')){
				hideAllTooltips(row)
				use_prompt(id);
            }
			else if(target.classList.contains('share')){
				hideAllTooltips(row)
				let subreddit = `https://www.reddit.com/r/ChatGPTPromptGenius/submit`
				let text = prompt.text.replace(/\n/g,"                                                           ")
				let category = "";
				if (prompt.category){
					category = prompt.category
				}
				let template =
				encodeURIComponent(
`&#x200B;

|Prompt Title|${prompt.title}|
|:-|:-|
|Prompt Text|${text}|
|Category|${category}|

\-----------

Additional information:

				`)
				let url = `${subreddit}?title=${prompt.title}&text=${template}`;
				window.open(url, '_blank');
			}
			else if (target.classList.contains('edit-button')){
				toggle_prompt_editable(id, row);
			}
			else if (target.classList.contains('prompt-text')){
				toggle_prompt_editable(id, row);
			}
			else if (target.classList.contains('edit-tags')){
				toggleTagsEditable(id, row)
			}
			else if (target.classList.contains('tag-remove')){
				removeTag(id, row, target)
			}
			else if (target.classList.contains('selected')){
				chrome.storage.local.get(["prompts"], function (result){
					let newp = result.prompts
					let newTagList = tagList.filter(item => item !== target.textContent);
					load_prompts(newp, search, search_term, newTagList)
				})
			}
			else if (target.classList.contains("tag")) {
				chrome.storage.local.get(["prompts"], function (result){
					let newp = result.prompts
					let newTagList = [...tagList, `${target.textContent}`]
					load_prompts(newp, search, search_term, newTagList)
				})
			}
			else if (target.classList.contains('addTags')){

			}
			else if (target.classList.contains('tag')){

			}
			else if (target.classList.contains('title-text')){
				// Catchall
			}
			else if (target.classList.contains('select') || target.parentElement.classList.contains('select')){
				// Catchall use event listener for change instead
			}
			else if (target.tagName === 'TEXTAREA'){
				// Catchall
			}
			else if (target.classList.contains('prompt')) {
				toggle_prompt_editable(id, row);
			}
			else {
				// if enabled, then disable
				if(row.querySelector('textarea')){
					toggle_prompt_editable(id, row);
				}
				else{
					//use_prompt(id)
				}
			}
		});
		prompt_text.addEventListener('keydown', (event) => {
			let ctrlBool;
			if (ctrlSave === true){
				ctrlBool = (event.key === 'Enter' && (event.ctrlKey || event.metaKey))
			}
			else{
				ctrlBool = (event.key === 'Enter' && !event.shiftKey);
			}
			if (ctrlBool) { // see line 51
				toggle_prompt_editable(id, row);
			}
		});
		if (tagList.length === 0 || hasAllTags(prompt.tags, tagList)) {
			main.appendChild(template);
		}
	}
	if (alteredOldPrompts){
		chrome.storage.local.set({prompts: prompts})
	}
	draggables()
	tooltips()
	updateAutoComplete()
}

function hideAllTooltips(row){
	let btns = row.querySelectorAll(".btn")
	for (let btn of btns){
		bootstrap.Tooltip.getInstance(btn).hide()
	}
}

function reorderObjectsByRow(objects) {
	const rows = document.querySelectorAll('.row');
	const objectsById = {}; // map object id to object

	// build map of objects by id
	for (const object of objects) {
		objectsById[object.id] = object;
	}

	// sort rows by their position in the DOM
	const sortedRows = Array.from(rows).sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

	// iterate over rows and reorder objects
	for (const row of sortedRows) {
		const objectId = row.id;
		const object = objectsById[objectId];

		// move the row to the correct position in the DOM
		row.parentNode.insertBefore(row, row.previousSibling);

		// if the object was found, update its position in the array
		if (object) {
			const index = objects.indexOf(object);
			objects.splice(index, 1);
			objects.splice(sortedRows.indexOf(row), 0, object);
		}
	}
	return objects
}

function reorderList(){
	chrome.storage.local.get({"prompts": []}, function (result) {
		let newobj = reorderObjectsByRow(result.prompts).reverse() // reverse it because that's how it's stored
		chrome.storage.local.set({"prompts": newobj})
	})
}

function draggables(){
	let items = document.getElementById("main")
	let sd = Sortable.create(items, {
		scroll: true,
		forceAutoscrollFallback: true,
		scrollSensitivity: 90,
		bubbleScroll: true,
		scrollSpeed: 100,
		onEnd: function(evt) {
			reorderList()
		}
	});
}

function updateAutoComplete(){
	let autoCompleteTags = document.querySelectorAll(".addTags")
	for (let i = 0; i < autoCompleteTags.length; i++){
		let tagInput = autoCompleteTags[i]
		let filteredTags = allTags.filter(tag => { // thanks ChatGPT
			let tagInputParent = tagInput.parentElement.parentElement.parentElement;
			let childTags = tagInputParent.querySelector('.tags').children;
			for (let i = 0; i < childTags.length; i++) {
				if (childTags[i].textContent === tag) {
					return false; // don't include tag in filteredTags
				}
			}
			return true; // include tag in filteredTags
		});
		autocomplete(tagInput, filteredTags)
	}
}

function hasAllTags(tags, tagFilter) {
	return tagFilter.every(tag => tags.includes(tag));
}

function toggleTagsEditable(id, row){
	chrome.storage.local.get({"changedPrompts": []}, function (result){
		let changedPrompts = result.changedPrompts
		if (!changedPrompts.includes(id)){
			changedPrompts.push(id)
			chrome.storage.local.set({"changedPrompts": changedPrompts})
		}
	})
	let tagDiv = row.querySelector('.tags')
	let tags = tagDiv.children
	let edit_icon = row.querySelector('.edit-tags')
	if (!tagDiv.classList.contains("editable")) {
		edit_icon.classList.remove("fa-pen-to-square");
		edit_icon.classList.add("fa-floppy-disk-pen");
		for (let tag of tags) {
			let tname = tag.innerHTML
			tag.innerHTML = `<i class="fa-solid fa-xmark"></i> ${tname}`
			tag.classList.add("tag-remove")
		}
		tagDiv.classList.add("editable")
	}
	else {
		edit_icon.classList.add("fa-pen-to-square");
		edit_icon.classList.remove("fa-floppy-disk-pen");
		for (let tag of tags) {
			let tname = tag.innerHTML
			tag.innerHTML = tname.replace(`<i class="fa-solid fa-xmark"></i> `, "")
			tag.classList.remove("tag-remove")
		}
		tagDiv.classList.remove("editable")
	}
}

function removeTag(id, row, target){
	let tags = row.querySelector(".tags")
	const idx = Array.from(tags.children).indexOf(target); // thanks ChatGPT
	target.remove()
	chrome.storage.local.get({prompts: []}, function(result){
		let prompts = result.prompts
		let prompt = getObjectById(id, prompts)
		if (!prompt){
			console.warn(`toggle_prompt_editable: cannot find prompt of id ${id}.`);
			return;
		}
		let tags = prompt.tags ?? [];
		tags.splice(idx, 1);
		chrome.storage.local.set({prompts: prompts})
		user_prompts = prompts
	})
}

function addTag(id, row){
	chrome.storage.local.get({"changedPrompts": []}, function (result){
		let changedPrompts = result.changedPrompts
		if (!changedPrompts.includes(id)){
			changedPrompts.push(id)
			chrome.storage.local.set({"changedPrompts": changedPrompts})
		}
	})
	let tagName = row.querySelector('.addTags').value.trim()
	let tags = row.querySelector(".tags")
	chrome.storage.local.get({prompts: []}, function(result){
		let prompts = result.prompts
		let prompt = getObjectById(id, prompts)
		if (!prompt){
			console.warn(`toggle_prompt_editable: cannot find prompt of id ${id}.`);
			return;
		}
		if (!prompt.tags.includes(tagName)) {
			tags.insertAdjacentHTML("beforeend", `<span class="tag">${tagName}</span>`)
			prompt.tags.push(tagName)
			chrome.storage.local.set({prompts: prompts})
			user_prompts = prompts
			let clist = Array.from(row.querySelector('.tags').classList)
			console.log(clist.includes('editable'))
			if (clist.includes('editable')){
				toggleTagsEditable(id, row)
				toggleTagsEditable(id, row)
			}
			if (!allTags.includes(tagName)){
				allTags.push(tagName)
			}
			updateAutoComplete()
		}
	})
	row.querySelector('.addTags').value = ""
}

function delete_prompt(id) {
	console.log(id)
	chrome.storage.local.get({"deletedPrompts": []}, function (result){
		let dp = result.deletedPrompts;
		dp.push(id)
		chrome.storage.local.set({"deletedPrompts": dp});
	});
	chrome.storage.local.get({prompts: default_prompts}, function (result) {
		let prompts = result.prompts;
		let prompt = getObjectById(id, prompts);
		if(!prompt)
		{
			console.warn(`toggle_prompt_editable: cannot find prompt of id ${id}.`);
			return;
		}
		if (imported_prompts.includes(prompt.title)){
			imported_prompts.splice(imported_prompts.indexOf(prompt.title), 1);
			chrome.storage.local.set({imported_prompts: imported_prompts});
		}
		removeElementInArray(prompts, prompt);
		chrome.storage.local.set({prompts: prompts});
		user_prompts = prompts;
		load_prompts(prompts);
	});
}

function choose_category(id, row) {
	chrome.storage.local.get({"changedPrompts": []}, function (result){
		let changedPrompts = result.changedPrompts
		if (!changedPrompts.includes(id)){
			changedPrompts.push(id)
			chrome.storage.local.set({"changedPrompts": changedPrompts})
		}
	})
	let category = row.querySelector('.select').value;
	chrome.storage.local.get({prompts: default_prompts}, function (result) {
		let prompts = result.prompts;
		let prompt = getObjectById(id, prompts);
		if(!prompt)
		{
			console.warn(`choose_category: cannot find prompt of id ${id}.`);
			return;
		}
		prompt.category = category
		chrome.storage.local.set({prompts: prompts});
		load_prompts(prompts);
	});
}

function use_prompt(id) {
	chrome.storage.local.get({prompts: default_prompts}, function (result) {
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

function toggle_prompt_editable(id, element, just_title=false) {
	let edit_icon = element.querySelector(".edit-button");
	let prompt_title =  element.querySelector(".title-text");
	let prompt_text = element.querySelector(".prompt-text");
	chrome.storage.local.get({"changedPrompts": []}, function (result){
		let changedPrompts = result.changedPrompts
		if (!changedPrompts.includes(id)){
			changedPrompts.push(id)
			chrome.storage.local.set({"changedPrompts": changedPrompts})
		}
	})
	if(!prompt_text.querySelector("textarea")) {
		let textarea = document.createElement("textarea");
		prompt_text.innerHTML = "";
		prompt_text.appendChild(textarea)
		chrome.storage.local.get({prompts: default_prompts}, function (result) {
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
	else {
		console.log('saving')
		let textarea = prompt_text.querySelector("textarea");
		let text = textarea.value;
		chrome.storage.local.get({prompts: default_prompts}, function (result) {
			let prompts = result.prompts;
			let prompt = getObjectById(id, prompts);
			if(!prompt)
			{
				console.warn(`toggle_prompt_editable: cannot find prompt of id ${id}.`);
				return;
			}
			prompt.text = text;
			prompt.title = prompt_title.innerText;
			prompt.lastChanged = new Date().getTime()
			chrome.storage.local.set({prompts: prompts});
		});
		// make title uneditable
		prompt_title.classList.remove('editable')
		prompt_title.contentEditable = "inherit";

		if (!just_title) {
			prompt_text.innerHTML = text;
			edit_icon.classList.add("fa-pen-to-square");
			edit_icon.classList.remove("fa-floppy-disk-pen");
		}
	}
}

function new_blank_prompt(){
	new_prompt("Untitled Prompt","")
}

function new_prompt(title, text, tags="", category="") {
	let prompt = {
		date: getDate(),
		time: getTime(),
		id: generateUUID(),
		title: title,
		text: text,
		tags: tags,
		category: category,
		lastChanged: new Date().getTime()
	};
	chrome.storage.local.get({"newPrompts": []}, function (response){
		let newPrompts = response.newPrompts
		newPrompts.push(prompt.id)
		chrome.storage.local.set({"newPrompts": newPrompts})
	})
	chrome.storage.local.get({prompts: []}, function (r){
		user_prompts = r.prompts
		user_prompts.push(prompt)
		chrome.storage.local.set({prompts: user_prompts});
		load_prompts(user_prompts);
	})
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

document.querySelector("#new_prompt_button").addEventListener('click', new_blank_prompt)


function CSVToArray(strData, strDelimiter) {
	strDelimiter = strDelimiter || ",";
	var pattern = new RegExp(
		"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
		"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
		"([^\"\\" + strDelimiter + "\\r\\n]*))",
		"gi"
	);
	var data = [[]];
	var matches;
	while (matches = pattern.exec(strData)) {
		var delimiter = matches[1];
		if (delimiter.length && delimiter !== strDelimiter) {
			data.push([]);
		}
		var value = matches[2]
			? matches[2].replace(new RegExp("\"\"", "g"), "\"")
			: matches[3];
		data[data.length - 1].push(value);
	}
	return data;
}
function noHighlight(text){
	return text.replace(/<span class="highlight">/g, "").replace(/<\/span>/g, "")
}

function fillAndAppendTemplate(title, text, i, tags="", category="") {
	// Get the template element
	const template = document.querySelector('.explore-template');

	// Create a copy of the template
	const promptDiv = template.content.cloneNode(true);

	// Fill in the values for title and text
	promptDiv.querySelector('.public-title').innerHTML = title;
	promptDiv.querySelector('.public-text').innerHTML = text;

	// Add prompt when clicked
	promptDiv.querySelector('.prompt-div').addEventListener('click', function() {
		let no_highlight_text = noHighlight(text);
		let nh_title = noHighlight(title);
		let nh_tags = noHighlight(tags);
		let nh_category = noHighlight(category);
		new_prompt(nh_title, no_highlight_text, nh_tags, nh_category);
		imported_prompts.push(title);
		chrome.storage.local.set({imported_prompts: imported_prompts});
		publicTemps.splice(i, 1);
		modal.hide();
	})

	// Append the prompt div to the modal body
	document.querySelector('.modal-main').appendChild(promptDiv);
}


let publicTemps;
function fetch_templates(){
	const host = `https://raw.githubusercontent.com/benf2004/ChatGPT-History/master/public`
	fetch(`${host}/csv/prompts.csv`)
		// Convert the response to text
		.then(res => res.text())
		// Convert the CSV text to an array of records
		.then(csv => CSVToArray(csv))
		// Map the records to template objects with properties 'title', 'prompt', and 'placeholder'
		.then(records => {
			return records.map(([ title, prompt, placeholder, tags, category ]) => {
				return { title, prompt, tags, category }
			})
			.filter(({ title }) => title && title !== 'title')
				.filter (({ title }) => !imported_prompts.includes(title))
		})
		.then(templates => {
			// Save the array of prompt templates to a global variable
			publicTemps = templates;
			console.log(publicTemps)
		})
}
fetch_templates()
let first_time = true;

let currentIndex = 0;
const forwardButton = document.querySelector('.forward-button');
const backwardButton = document.querySelector('.backward-button');
forwardButton.addEventListener('click', () => {currentIndex += 3;});

backwardButton.addEventListener('click', () => {
	currentIndex -= 3;
})

function loadCuratedPrompts(prompts, search=false, search_term=""){
	console.log("CALLED!")
	document.querySelector('.modal-main').innerHTML = '';
	backwardButton.disabled = true;
	forwardButton.enabled = true;

	if (search) {
		currentIndex = 0;
	}

	function updateTemplates(temps) {
		// Clear the modal body
		document.querySelector('.modal-main').innerHTML = '';

		// Loop through the next three elements and fill the template
		for (let i = currentIndex; i < currentIndex + 3; i++) {
			//console.log(temps[i])
			//console.log(i)
			if (temps[i]) {
				let title = temps[i].title;
				let text = temps[i].prompt
				var tags = ""
				if (temps[i].tags) {
					tags = temps[i].tags
					console.log("TRUE")
				}
				var category = ""
				if (temps[i].category){
					category = temps[i].category
				}
				console.log(tags)
				if (search) {
					title = searchString(title, search_term);
					text = searchString(text, search_term);
				}
				fillAndAppendTemplate(title, text, i, tags, category);
			}
		}
		forwardButton.disabled = currentIndex >= temps.length - 3
		backwardButton.disabled = currentIndex <= 0;
	}
	updateTemplates(prompts)
	forwardButton.addEventListener('click', () => {updateTemplates(prompts)});

	backwardButton.addEventListener('click', () => {updateTemplates(prompts)})

}

document.querySelector('#explore').addEventListener('click', () => loadCuratedPrompts(publicTemps))

let imported_prompts = [];
chrome.storage.local.get({imported_prompts: []}, function (result) {
	imported_prompts = result.imported_prompts;
})

function searchUserPrompts() {
	let search_term = document.querySelector('.search-bar').value
	console.log(search_term)
	let ts = searchPrompts(user_prompts, search_term)
	main.innerHTML = ""
	if (search_term === ""){
		load_prompts(user_prompts)
	}
	else {
		load_prompts(ts, true, search_term)
	}
}

function searchCuratedPrompts() {
	let search_term = document.querySelector('#modal-search-bar').value
	let results = searchPrompts(publicTemps, search_term)
	console.log(results)
	document.querySelector('.modal-main').innerHTML = ''
	if (search_term === ""){
		currentIndex = 0;
		loadCuratedPrompts(publicTemps)
	}
	else {
		loadCuratedPrompts(results, true, search_term)
	}
}

function searchPrompts(prompts, searchTerm) { // created by ChatGPT
	console.log(prompts)
	searchTerm = searchTerm.toLowerCase();
	return prompts.filter(prompt => {
		return (
			prompt.title.toLowerCase().includes(searchTerm) ||
			(prompt.text && prompt.text.toLowerCase().includes(searchTerm)) || (prompt.tags && prompt.tags.includes(searchTerm))
		);
	});
}


document.querySelector('#modal-search-bar').addEventListener('input', searchCuratedPrompts)
document.querySelector('.search-bar').addEventListener('input', searchUserPrompts)

// Tooltips
function tooltips() {
	var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
	var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
		return new bootstrap.Tooltip(tooltipTriggerEl)
	})
}
setTimeout(tooltips, 500)

function getMatchingCategory(objects, category) {
	const matchingObjects = [];
	for (let i = 0; i < objects.length; i++) {
		if (objects[i].category === category) {
			matchingObjects.push(objects[i]);
		}
	}
	return matchingObjects;
}

function autocomplete(inp, arr) { // thanks w3Schools: https://www.w3schools.com/howto/howto_js_autocomplete.asp
	/*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
	var currentFocus;
	/*execute a function when someone writes in the text field:*/
	inp.addEventListener("input", function(e) {
		var a, b, i, val = this.value;
		/*close any already open lists of autocompleted values*/
		closeAllLists();
		if (!val) { return false;}
		currentFocus = -1;
		/*create a DIV element that will contain the items (values):*/
		a = document.createElement("DIV");
		a.setAttribute("id", this.id + "autocomplete-list");
		a.setAttribute("class", "autocomplete-items");
		/*append the DIV element as a child of the autocomplete container:*/
		this.parentNode.appendChild(a);
		/*for each item in the array...*/
		for (i = 0; i < arr.length; i++) {
			/*check if the item starts with the same letters as the text field value:*/
			if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
				/*create a DIV element for each matching element:*/
				b = document.createElement("DIV");
				/*make the matching letters bold:*/
				b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
				b.innerHTML += arr[i].substr(val.length);
				/*insert a input field that will hold the current array item's value:*/
				b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
				/*execute a function when someone clicks on the item value (DIV element):*/
				b.addEventListener("click", function(e) {
					/*insert the value for the autocomplete text field:*/
					inp.value = this.getElementsByTagName("input")[0].value;
					/*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
					closeAllLists();
				});
				a.appendChild(b);
			}
		}
		addActive(a.getElementsByTagName("div"));
	});
	/*execute a function presses a key on the keyboard:*/
	inp.addEventListener("keydown", function(e) {
		var x = document.getElementById(this.id + "autocomplete-list");
		if (x) x = x.getElementsByTagName("div");
		if (e.keyCode == 40) {
			/*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
			currentFocus++;
			/*and and make the current item more visible:*/
			addActive(x);
		} else if (e.keyCode == 38) { //up
			/*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
			currentFocus--;
			/*and and make the current item more visible:*/
			addActive(x);
		} else if (e.keyCode == 13) {
			/*If the ENTER key is pressed, prevent the form from being submitted,*/
			e.preventDefault();
			if (currentFocus > -1) {
				/*and simulate a click on the "active" item:*/
				if (x) x[currentFocus].click();
			}
		}
	});
	function addActive(x) {
		/*a function to classify an item as "active":*/
		if (!x) return false;
		/*start by removing the "active" class on all items:*/
		removeActive(x);
		if (currentFocus >= x.length) currentFocus = 0;
		if (currentFocus < 0) currentFocus = (x.length - 1);
		/*add class "autocomplete-active":*/
		x[currentFocus].classList.add("autocomplete-active");
	}
	function removeActive(x) {
		/*a function to remove the "active" class from all autocomplete items:*/
		for (var i = 0; i < x.length; i++) {
			x[i].classList.remove("autocomplete-active");
		}
	}
	function closeAllLists(elmnt = document.body) {
		/*close all autocomplete lists in the document,
        except the one passed as an argument:*/
		var x = document.getElementsByClassName("autocomplete-items");
		for (var i = 0; i < x.length; i++) {
			if (elmnt != x[i] && elmnt != inp) {
				x[i].parentNode.removeChild(x[i]);
			}
		}
	}
	/*execute a function when someone clicks in the document:*/
	document.addEventListener("click", function (e) {
		closeAllLists(e.target);
	});
	inp.addEventListener("keydown", function (event){
		if (event.key === "Enter"){
			closeAllLists()
		}
	});
}

function category_filter(){
	let category = document.querySelector('#category-filter').value
	if (document.querySelector('#filter')) {
		document.querySelector('#filter').remove()
	}
	let promptsInCat = getMatchingCategory(user_prompts, category)
	if (promptsInCat.length > 0) {
		load_prompts(promptsInCat)
	}
	else{
		main.innerHTML = ""
	}
	if (category === "All"){
		load_prompts(user_prompts)
	}
}
document.querySelector('#category-filter').addEventListener('change', category_filter)

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.message === "New Prompt"){
			document.querySelector(".edit-button").click()
		}
	}
);

async function getAd(){
	const host = `https://raw.githubusercontent.com/benf2004/ChatGPT-History/master/public`;
	const rando = generateUUID() // to not get cached version because headers were causing problems.
	const response = await fetch(`${host}/ads/current.txt?dummy=${rando}`);
	if (!response.ok) {
		throw new Error("HTTP error " + response.status);
	}
	else {
		let text = await response.text();
		text = text.replaceAll(`<u>`,"").replaceAll(`</u>`, "")
		document.getElementById("ad").innerHTML = text
	}
}
getAd()

/* right click toast - will show to new users
chrome.storage.local.get({seenToast2: false}, function (response){
	let seenRightClickToast = response.seenToast2;
	if (!seenRightClickToast) {
		chrome.storage.local.set({seenToast2: true})
		document.body.appendChild(document.getElementById("toast").content.cloneNode(true))
		let toastEl = document.getElementById('rightClickSaveToast')
		let toast = new bootstrap.Toast(toastEl)
		toast.show()
	}
})*/