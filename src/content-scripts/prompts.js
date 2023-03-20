let isCompact;
let firstTime = true;
(() => {
    // Save a reference to the original fetch function
    const fetch = window._fetch = window._fetch || window.fetch
    window.fetch = (...t) => {
        // If the request is not for the chat backend API or moderations, just use the original fetch function
        if (!(t[0].includes('https://chat.openai.com/backend-api/conversation') || t[0].includes('https://chat.openai.com/backend-api/moderations'))) return fetch(...t)

        try {
            // Get the options object for the request, which includes the request body
            const options = t[1]
            // Parse the request body from JSON
            const body = JSON.parse(options.body)
            if (body.hasOwnProperty('conversation_id') && !document.querySelector('#conversationID')) {
                // rather than deal with message passing, we use a DOM element which the content scripts can access
                let conversationID = body['conversation_id']
                document.body.appendChild(document.createElement(`input`)).setAttribute("id", "conversationID")
                document.querySelector("#conversationID").setAttribute("type", "hidden")
                document.querySelector("#conversationID").style.display = "none"
                document.querySelector("#conversationID").value = conversationID
                return fetch(...t)
            }

            // If no prompt template has been selected, use the original fetch function
            else {
                return fetch(...t)
            }
        } catch {
            // If there was an error parsing the request body or modifying the request,
            // just use the original fetch function
            return fetch(...t)
        }
    }

    // Create a new observer for the chat sidebar to watch for changes to the document body
    const observer = new MutationObserver(mutations => {
        // For each mutation (change) to the document body
        mutations.forEach(mutation => {
            // If the mutation is not a change to the list of child nodes, skip it
            if (mutation.type !== 'childList')
                // If no new nodes were added, skip this mutation
                if (mutation.addedNodes.length == 0) return
            // Get the first added node
            const node = mutation.addedNodes[0]
            // If the node is not an element or does not have a `querySelector` method, skip it
            if (!node || !node.querySelector) return
            // Call the `handleElementAdded` function with the added node
            handleElementAdded(node)
        })
    })

    // Start observing the document body for changes
    observer.observe(document.body, { subtree: true, childList: true })

    // Fetch the list of prompt templates from a remote CSV file
    /*fetch('https://raw.githubusercontent.com/mohalobaidi/awesome-chatgpt-prompts/main/prompts.csv')
        // Convert the response to text
        .then(res => res.text())
        // Convert the CSV text to an array of records
        .then(csv => CSVToArray(csv))
        // Map the records to template objects with properties 'title', 'prompt', and 'placeholder'
        .then(records => {
            return records.map(([ title, prompt, placeholder ]) => {
                return { title, prompt, placeholder }
            })
                // Filter out records that do not have a title or it is the header row (with "title" as its title)
                .filter(({ title }) => title && title !== 'title')
        })
        .then(templates => {
            // Save the array of prompt templates to a global variable
            window.prompttemplates = templates
            console.log(templates)
            // Insert the "Prompt Templates" section into the chat interfac
            insertPromptTemplatesSection()
        }) */
    function loadUserPrompts() {
		let promptsRawString = document.querySelector('#prompts_storage').value;
        isCompact = (document.querySelector("#isCompact")?.value === "true") ?? false;
        console.log(typeof isCompact)
        console.log(isCompact)
		if(promptsRawString)
		{
			// if no prompts, do nothing
			let prompts = JSON.parse(promptsRawString);
			window.prompttemplates = prompts.reverse()
			insertPromptTemplatesSection()
			document.querySelector('#prompts_storage').remove()
		}

    }
    setTimeout(loadUserPrompts, 500) // delay to make sure insertPromptTemplates works right

    document.head.insertAdjacentHTML("beforeend",
`<style>
        .highlight {
        color: black!important;
        background-color: yellow;
        font-weight: bold;
        opacity: 0.4;
        }
        #templates-wrapper
    </style>`)

    // Set up the Sidebar (by adding "Export Chat" button and other stuff)
    setupSidebar()
})()

// This function is called for each new element added to the document body
function handleElementAdded (e) {
    // If the element added is the root element for the chat sidebar, set up the sidebar
    if (e.id === 'headlessui-portal-root') {
        setupSidebar()
        return
    }

    // Add "Copy Button" to Assistant's chat bubble.
    if (e.querySelector('.lg\\:self-center.lg\\:pl-2')) {
        // Get buttons group
        const buttonGroup = e.querySelector('.lg\\:self-center.lg\\:pl-2')
        // Filter out Assistant's chat bubble from User's chat bubble
        if (buttonGroup.children.length !== 2) return
        // It heavily depends on the fact Assistant's has two buttons, "upvote" and "downvote".
        // and the user has only one button, "edit prompt".
        addCopyButton(buttonGroup)
    }

}

function hideTitleAndExamples(title, isPlus) {
    title.style = 'display: none';
    if (!isPlus && title.nextSibling) {
        title.nextSibling.style = 'display: none';
    }
}

// the "New Chat" buttons to clear the selected prompt template when clicked
function setupSidebar () {
    let newChatButton = document.querySelector('nav').firstChild
    newChatButton.addEventListener('click', () => {
        if (document.querySelector('#conversationID')){
            document.querySelector('#conversationID').remove()
        }
        setTimeout(insertPromptTemplatesSection, 300)
    })
    /* Get the "New Chat" buttons
    const buttons = getNewChatButtons()
    // Set the onclick event for each button to clear the selected prompt template
    /*buttons.forEach(button => {
        button.onclick = () => {
            selectPromptTemplate(null)
        }
    })*/
}

/* This function gets the "New Chat" buttons
function getNewChatButtons (callback) {
    // Get the sidebar and topbar elements
    const sidebar = document.querySelector('nav')
    const topbar = document.querySelector('.sticky')
    // Get the "New Chat" button in the sidebar
    const newChatButton = [...sidebar?.querySelectorAll('.cursor-pointer') ?? []].find(e => e.innerText === 'New Chat')
    // Get the "Plus" button in the topbar
    const AddButton = topbar?.querySelector("button.px-3")
    // Return an array containing the buttons, filtering out any null elements
    return [newChatButton, AddButton].filter(button => button)
}*/

let focusSearch = false

// This object contains properties for the prompt templates section
const promptTemplateSection = {
    currentPage: 0, // The current page number
    pageSize: 5 // The number of prompt templates per page
}

function getMatchingCategory(category, objects = window.prompttemplates) {
    let matchingObjects = [];
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].category === category) {
            matchingObjects.push(objects[i]);
        }
    }
    return matchingObjects;
}

function highlightString(string, searchTerm) {
    // use the original case of the search term when highlighting it
    const searchTermRegex = new RegExp(searchTerm, "gi");
    return string.replace(searchTermRegex, `<span class="highlight">$&</span>`);
}

function searchPrompts(prompts, searchTerm) { // created by ChatGPT
    searchTerm = searchTerm.toLowerCase();
    return prompts.filter(prompt => {
        return (
            prompt.title.toLowerCase().includes(searchTerm) ||
            (prompt.text && prompt.text.toLowerCase().includes(searchTerm)) || (prompt.tags  && prompt.tags.includes(searchTerm))
        );
    });
}

function searchAndCat(fs){
    focusSearch = fs
    promptTemplateSection.currentPage = 0
    let searchTerm = document.querySelector("#search").value
    let prompts = window.prompttemplates
    let category = document.querySelector("#category").value
    if (category !== ""){
        prompts = getMatchingCategory(category, prompts)
    }
    if (searchTerm !== ""){
        prompts = searchPrompts(prompts, searchTerm)
    }
    updateTemplates(prompts, category, searchTerm)
}

let globalTemplates = window.prompttemplates

function tagStyling(){
    let styles =
    `
    <style>
    .tag {
    display: inline-block;
    background-color: transparent;
    border-radius: 2em;
    border: 1px solid #363636;
    padding: 0.2em 0.65em;
    cursor: pointer;
    font-size: 0.8em;
    line-height: 1;
    margin-right: 3px;
    margin-bottom: 3px;
    z-index: 99;
    }
    .tag:hover{
    border: 1px solid #0BA37F !important;
    }
    .tag:hover,
    .tag:hover ~ .template:hover{
        pointer-events: auto;
    }
    .dark .tag:hover{
    color: white
    }
    .light .tag:hover{
    color: black !important;
    }
    .tag.selected{
    border: 2px solid #0BA37F !important;
    }
    .dark .tag{
    border: 1px solid #AAAAAA;
    color: #DDDDDD
    }
    .light .tag{
        color: #555555;
    }
    .light .template:not(:has(.tag:hover)):hover{
        background-color: rgb(217, 217, 227);
    }
    .dark .template:not(:has(.tag:hover)):hover{
        background-color: rgb(32, 33, 35);
    }
    </style>
    `
    document.head.insertAdjacentHTML("beforeend", styles)
}

let globalTags = [];
// This function inserts a section containing a list of prompt templates into the chat interface
async function insertPromptTemplatesSection (templates = window.prompttemplates, category="", searchTerm="") {
    // Get the title element (as a reference point and also for some alteration)
    const title = document.querySelector('h1.text-4xl')

    const isMainPage = window.location.href.split("/").length === 4
    console.log("Is main" + isMainPage)
    // If there is no title element, return
    if (!title){
        if(isMainPage) {
            await new Promise(r => setTimeout(r, 500));
            console.log("NOT LOADED YET")
            insertPromptTemplatesSection(templates, category, searchTerm)
        }
        return;
    }
    // in ChatGPT plus title do not have next sibling
    const isPlus = isPaidSubscriptionActive() ?? false;
    hideTitleAndExamples(title, isPlus)

    if(title.parentElement){
        // Remove the "md:h-full" class from title.parentElement in free
        title.parentElement.classList.remove('md:h-full')
        // Remove the "h-full" calss from title.parentElement in plus
        title.parentElement.classList.remove('h-full')
    }

    if (isCompact){
        promptTemplateSection.pageSize = 10
    }
    else{
        promptTemplateSection.pageSize = 5
    }

    tagStyling()

    // Get the main page, in ChatGPT free is title's parent, in ChatGPT plus is parent's sibling
    let parent = title.parentElement;
    if (isPlus) {
        parent = document.querySelector("#templates-wrapper-main-page")
        if (!parent) {
            parent = document.createElement('div')
            parent.id = "templates-wrapper-main-page"
            parent.className = 'text-gray-800 w-full md:max-w-2xl lg:max-w-3xl md:flex md:flex-col px-6 dark:text-gray-100'
            title.parentElement.appendChild(parent)

            // fix some style issues
            title.parentElement.classList.add('items-center')
            title.previousElementSibling.classList.add('w-full')
        }
    }
    // If there is no parent element, skip
    if (!parent) return

    globalTemplates = templates

    // Get the current page number and page size from the promptTemplateSection object
    const { currentPage, pageSize } = promptTemplateSection
    // Calculate the start and end indices of the current page of prompt templates
    const start = pageSize * currentPage
    const end = Math.min(pageSize * (currentPage + 1), templates.length)
    // Get the current page of prompt templates
    const currentTemplates = templates.slice(start, end)

    const hs = highlightString
    // Create the HTML for the prompt templates section
    const html = `
    <div class="${css`column`}">
    ${svg`ChatBubble`}
    <div>
    <h2 class="${css`h2`}" style="margin-bottom: 5px">ChatGPT Prompt Genius Templates</h2>
    <div class="${css`paginationText`}" id="cgpt-pg-ad"></div>
    <ul class="flex flex-col gap-3.5">
    
    <div class="${css`selectDiv`}">
        <div style="">
            <select id="category" class="${css`select`}">
                <option value="" selected>All Categories</option>
                <option value="Academic Writing">Academic Writing</option>
                <option value="Bypass & Personas">Bypass & Personas</option>
                <option value="Education & Learning">Education & Learning</option>
                <option value="Expert/Consultant">Expert/Consultant</option>
                <option value="Fun & Games">Fun & Games</option>
                <option value="Fitness, Nutrition, & Health">Fitness, Nutrition, & Health</option>
                <option value="Fiction Writing">Fiction Writing</option>
                <option value="Music">Music</option>
                <option value="Nonfiction Writing">Nonfiction Writing</option>
                <option value="Other">Other</option>
                <option value="Philosophy & Logic">Philosophy & Logic</option>
                <option value="Poetry">Poetry</option>
                <option value="Programming & Technology">Programming & Technology</option>
                <option value="Speeches & Scripts">Speeches & Scripts</option>
                <option value="Social Media & Blogging">Social Media & Blogging</option>
                <option value="Travel">Travel</option>
                <option value="Therapy & Life-help">Therapy & Life-help</option>        
            </select>
        </div>
        <div style="">
                <input id="search" type="text" class="${css`search`}" autocomplete="off" placeholder="Search">
        </div>
    </div>
    <div>Compact view <input id="compact" type="checkbox"> | <a target="_blank" href="https://www.reddit.com/r/ChatGPTPromptGenius/">Discover Prompts ${svg`Arrow`}</a> | <a style="cursor: pointer" target="blank" id="userPrompts">My Prompts ${svg`Arrow`}</a>
    </div>
    
    <ul class="${css`ul`}" id="templates">
      ${currentTemplates.map((template, i) => `
        <button id="${template.id}" class="template ${css`card`}">
          <h3 class="child ${css`h3`}">${hs(template.title, searchTerm)}</h3>
          <p class="child compact-hide temp-text ${css`p`}">${hs(template.text, searchTerm)}</p>
          <p class="child compact-hide ${css `category`}">${hs(template.category, searchTerm)} ${tags(template.tags ?? [])}</p>
          <span class="child font-medium compact-hide">Use prompt →</span>
        </button>
      `).join('')}
    </ul>

    <div class="${css`column`} items-center">
      <span class="${css`paginationText`}" id="pagination">
        Showing <span class="${css`paginationNumber`}">${start + 1}</span> to <span class="${css`paginationNumber`}">${end}</span> of <a id="prompt-link"><span class="${css`paginationNumber`}">${templates.length} Entries</span></a>
      </span>
      <div class="${css`paginationButtonGroup`}">
        <button onclick="prevPromptTemplatesPage()" class="${css`paginationButton`}" style="border-radius: 6px 0 0 6px">Prev</button>
        <button onclick="nextPromptTemplatesPage()" class="${css`paginationButton`} border-0 border-l border-gray-500" style="border-radius: 0 6px 6px 0">Next</button>
      </div>
    </div>
    </ul>
    </div>
    
    <div style="height: 100px;"></div>
  `

    let wrapper = document.createElement('div')
    wrapper.id = 'templates-wrapper'
    wrapper.className = 'mt-6 md:flex items-start text-center gap-2.5 md:max-w-2xl lg:max-w-3xl m-auto text-sm'

    if (parent.querySelector('#templates-wrapper')) {
        wrapper = parent.querySelector('#templates-wrapper')
    } else {
        parent.appendChild(wrapper)
    }

    wrapper.innerHTML = html

    // scroll to top of page
    let scrollContainer = document.querySelector("main > div > div > div")
    setTimeout(() => scrollContainer.scrollTop = 0, 600);

    let catSelect = document.querySelector("#category")
    let search = document.querySelector("#search")

    if (focusSearch === true){
        search.focus()
    }

    catSelect.value = category
    catSelect.addEventListener("change", () => searchAndCat(false))

    search.value = searchTerm
    search.addEventListener("input", () => searchAndCat(true))

    // listen for compact mode checkmark click
    if (isCompact){
        document.getElementById("compact").checked = true
    }
    compactStyle()
    document.getElementById("compact").addEventListener("click", compactStyle)

    addButtonClicks(templates, category, searchTerm, [])
}

function addButtonClicks(t, category, searchTerm, tagList=[]){
    let templates = document.querySelectorAll(".template")
    for (let template of templates){
        template.addEventListener("click", event => {
            const target = event.target
            if (target.classList.contains("selected")){
                console.log("selected")
                let newTagList = tagList.filter(item => item !== target.innerText);
                updateTemplates(t, category, searchTerm, newTagList)
            }
            else if (target.classList.contains('tag')){
                let newTagList = [...tagList, target.innerText]
                updateTemplates(t, category, searchTerm, newTagList)
            }
            else{
                if (target.classList.contains(('template'))) {
                    let text = target.querySelector(".temp-text").textContent
                    selectPromptTemplate(text)
                }
                else if (target.classList.contains('child')){
                    let text = target.parentElement.querySelector(".temp-text").textContent
                    selectPromptTemplate(text)
                }
            }
        })
    }
}

function tags(tagList, selectedTags=[]){
    if (typeof tagList === "string"){
        return ""
    }
    let tagHTML = ""
    for (let tag of tagList){
        let selectedClass = ""
        if (selectedTags.includes(tag)){
            selectedClass = "selected"
        }
        tagHTML += `<span class="tag ${selectedClass}">${tag}</span>`
    }
    return tagHTML
}

let globalFiltered = null;
function updateTemplates(templates = window.prompttemplates, category="", searchTerm="", tagList =globalTags){
    globalTags = tagList
    globalTemplates = templates

    if (isCompact){
        promptTemplateSection.pageSize = 10
    }
    else{
        promptTemplateSection.pageSize = 5
    }

    let filteredTemplates = templates.filter(template => tagList.every(tag => template.tags?.includes(tag)))
    globalFiltered = filteredTemplates;

    // Get the current page number and page size from the promptTemplateSection object
    const { currentPage, pageSize } = promptTemplateSection
    // Calculate the start and end indices of the current page of prompt templates
    const start = pageSize * currentPage
    const end = Math.min(pageSize * (currentPage + 1), filteredTemplates.length)
    // Get the current page of prompt templates
    const currentTemplates = filteredTemplates.slice(start, end)


    const hs = highlightString

    let templateHTML =
        `
        ${currentTemplates
            .map((template, i) => `
        <button class="${css`card`} template">
          <h3 class="child ${css`h3`}">${hs(template.title, searchTerm)}</h3>
          <p class="child compact-hide temp-text ${css`p`}">${hs(template.text, searchTerm)}</p>
          <p class="child compact-hide ${css`category`}">${hs(template.category, searchTerm)} ${tags(template.tags ?? [], tagList)}</p>
          <span class="child font-medium compact-hide">Use prompt →</span>
        </button>
      `).join('')}
        `
    document.getElementById("templates").innerHTML = templateHTML
    let paginationHTML =   `Showing <span class="${css`paginationNumber`}">${start + 1}</span> to <span class="${css`paginationNumber`}">${end}</span> of <a id="prompt-link"><span class="${css`paginationNumber`}">${filteredTemplates.length} Entries</span></a>`

    document.getElementById("pagination").innerHTML = paginationHTML
    compactStyle()

    addButtonClicks(templates, category, searchTerm, tagList)
}

function compactStyle(){
    if (!firstTime) {
        isCompact = document.getElementById("compact").checked
    }
    let hideElements = document.querySelectorAll(".compact-hide")
    if (isCompact === true){
        for (let ele of hideElements){
            ele.style.display = "none";
        }
    }
    else {
        for (let ele of hideElements){
            ele.style.display = "block";
        }
    }
    firstTime = false
}

function prevPromptTemplatesPage () {
    promptTemplateSection.currentPage--
    promptTemplateSection.currentPage = Math.max(0, promptTemplateSection.currentPage)
    // Update the section
    updateTemplates(globalTemplates, "", "", globalTags)
}

function nextPromptTemplatesPage () {
    const templates = globalTemplates
    if (!templates || !Array.isArray(templates)) return

    let check = globalFiltered ?? templates

    promptTemplateSection.currentPage++
    promptTemplateSection.currentPage = Math.min(
        Math.floor(
            (check.length - 1) /
            promptTemplateSection.pageSize
        ),
        promptTemplateSection.currentPage
    )
    // Update the section
    updateTemplates(globalTemplates, "", "", globalTags)
}

function addCopyButton (buttonGroup) {
    const button = document.createElement('button')
    button.onclick = () => {
        const text = buttonGroup.parentElement.parentElement.innerText
        navigator.clipboard.writeText(text)
    }
    button.className = css`action`
    button.innerHTML = svg`Clipboard`
    buttonGroup.prepend(button)
}

let buildPrompts = true;
// This function selects a prompt template
function selectPromptTemplate (text) {
    const textarea = document.querySelector('textarea')
    /*const parent = textarea.parentElement
    let wrapper = document.createElement('div')
    wrapper.id = 'prompt-wrapper'
    if (parent.querySelector('#prompt-wrapper')) {
        wrapper = parent.querySelector('#prompt-wrapper')
    } else {
        parent.prepend(wrapper)
    }*/
    textarea.focus()
    function setText() {
        if (buildPrompts){
            text = textarea.value + text
        }
        textarea.value = text
        textarea.style.height = "200px"
        textarea.parentElement.querySelector('button').addEventListener('click', () => {
            textarea.style.height = "24px"
        })
        textarea.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                textarea.style.height = "24px"
            }
        })
    }
        setTimeout(setText, 100) //timeout for weird clear thing
}

function CSVToArray(strData, strDelimiter) {
    strDelimiter = strDelimiter || ",";
    var pattern = new RegExp(
        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
        "([^\"\\" + strDelimiter + "\\r\\n]*))",
        "gi"
    );
    var data = [[]];
    var matchesf;
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

function svg (name) {
    name = Array.isArray(name) ? name[0] : name
    switch (name) {
        case 'Archive': return '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" height="1em" <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>'
        case 'ChatBubble': return '<svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 m-auto" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>'
        case 'Clipboard': return '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>'
        case "Arrow": return `<svg style="display: inline!important;" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`
    }
}

function css (name) {
    name = Array.isArray(name) ? name[0] : name
    switch (name) {
        case 'select': return 'bg-gray-100 border-0 text-sm rounded block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white hover:bg-gray-200 focus:ring-0 dark:hover:bg-gray-900';
        case 'selectDiv': return 'grid grid-cols-2 flex sm:flex gap-2 items-end justify-left lg:-mb-4 lg:max-w-3xl md:last:mb-6 pt-2 stretch text-left text-sm';
        case 'search': return 'bg-gray-100 border-0 text-sm rounded block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white hover:bg-gray-200 focus:ring-0 md:w-50';
        case 'column': return 'flex flex-col gap-3.5 flex-1 px-'
        case 'h2': return 'text-lg font-normal'
        case 'h3': return 'm-0 tracking-tight leading-8 text-gray-900 dark:text-gray-100 text-xl'
        case 'ul': return 'flex flex-col gap-3.5'
        case 'card': return 'flex flex-col gap-2 text-sm w-full bg-gray-50 dark:bg-white/5 p-4 rounded-md text-left'
        case 'p': return 'm-0 font-light text-gray-600 dark:text-gray-300'
        case 'category': return 'm-0 font-light text-gray-700 dark:text-gray-200'
        case 'paginationText': return 'text-sm text-gray-700 dark:text-gray-400'
        case 'paginationNumber': return 'font-semibold text-gray-900 dark:text-white'
        case 'paginationButtonGroup': return 'inline-flex mt-2 xs:mt-0'
        case 'paginationButton': return 'px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white'
        case 'action': return 'p-1 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible'
        case 'tag': return 'inline-flex items-center py-1 px-2 mr-2 mb-2 text-sm font-medium text-white rounded bg-gray-600 whitespace-nowrap'
    }
}

let prompts_url = window.location.href;

function check_url() {
    if (prompts_url !== window.location.href) {
        prompts_url = window.location.href;
        setTimeout(insertPromptTemplatesSection, 300)
        let newChatButton = document.querySelector('nav').firstChild
        newChatButton.addEventListener('click', () => {
            setTimeout(insertPromptTemplatesSection, 300)
        })
        console.log("URL CHANGE")
    }
}

setInterval(check_url, 1000);