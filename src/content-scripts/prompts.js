(() => {
    // Save a reference to the original fetch function
    const fetch = window._fetch = window._fetch || window.fetch
    // Replace the fetch function with a modified version that will include a prompt template
    // if one has been selected by the user
    window.fetch = (...t) => {
        // If the request is not for the chat backend API or moderations, just use the original fetch function
        if (!(t[0].includes('https://chat.openai.com/backend-api/conversation') || t[0].includes('https://chat.openai.com/backend-api/moderations'))) return fetch(...t)
        // Get the selected prompt template
        // const template = window.selectedprompttemplate

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
            /*if (window.selectedprompttemplate) {
                // Get the prompt from the request body
                const prompt = body.messages[0].content.parts[0]
                // Replace the prompt in the request body with the selected prompt template,
                // inserting the original prompt into the template
                body.messages[0].content.parts[0] = template.prompt.replace('[INSERT]', prompt)
                // Clear the selected prompt template
                selectPromptTemplate(null)
                // Stringify the modified request body and update the options object
                options.body = JSON.stringify(body)
                // Use the modified fetch function to make the request
                return fetch(t[0], options)
            }*/
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
		if(promptsRawString)
		{
			// if no prompts, do nothing
			let prompts = JSON.parse(promptsRawString);
			window.prompttemplates = prompts.reverse()
			console.log(window.prompttemplates)
			insertPromptTemplatesSection()
			document.querySelector('#prompts_storage').remove()
		}
        
    }
    setTimeout(loadUserPrompts, 500) // delay to make sure insertPromptTemplates works right

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

// This object contains properties for the prompt templates section
const promptTemplateSection = {
    currentPage: 0, // The current page number
    pageSize: 5 // The number of prompt templates per page
}

// This function inserts a section containing a list of prompt templates into the chat interface
function insertPromptTemplatesSection () {
    // Get the title element (as a reference point and also for some alteration)
    const title = document.querySelector('h1.text-4xl')
    // If there is no title element, return
    if (!title) return

    // Get the list of prompt templates
    const templates = window.prompttemplates
    // If there are no templates, skip
    if (!templates) return

    // Get the parent element of the title element (main page)
    const parent = title.parentElement
    // If there is no parent element, skip
    if (!parent) return

    // Remove the "md:h-full" class from the parent element
    parent.classList.remove('md:h-full')

    // Get the current page number and page size from the promptTemplateSection object
    const { currentPage, pageSize } = promptTemplateSection
    // Calculate the start and end indices of the current page of prompt templates
    const start = pageSize * currentPage
    const end = Math.min(pageSize * (currentPage + 1), templates.length)
    // Get the current page of prompt templates
    const currentTemplates = window.prompttemplates.slice(start, end)

    // Create the HTML for the prompt templates section
    const html = `
    <div class="${css`column`}">
    ${svg`ChatBubble`}
    <h2 class="${css`h2`}">
    <ul class="${css`ul`}">
      ${currentTemplates.map((template, i) => `
        <button onclick="selectPromptTemplate(${start + i})" class="${css`card`}">
          <h3 class="${css`h3`}">${template.title}</h3>
          <p class="${css`p`}">${template.text}</p>
          <span class="font-medium">Use prompt →</span>
        </button>
      `).join('')}
    </ul>

    <div class="${css`column`} items-center">
      <span class="${css`paginationText`}">
        Showing <span class="${css`paginationNumber`}">${start + 1}</span> to <span class="${css`paginationNumber`}">${end}</span> of <a id="prompt-link"><span class="${css`paginationNumber`}">${templates.length} Entries</span></a>
      </span>
      <div class="${css`paginationButtonGroup`}">
        <button onclick="prevPromptTemplatesPage()" class="${css`paginationButton`}" style="border-radius: 6px 0 0 6px">Prev</button>
        <button onclick="nextPromptTemplatesPage()" class="${css`paginationButton`} border-0 border-l border-gray-500" style="border-radius: 0 6px 6px 0">Next</button>
      </div>
    </div>
    </div>
  `

    let wrapper = document.createElement('div')
    wrapper.id = 'templates-wrapper'
    wrapper.className = 'mt-6 flex items-start text-center gap-3.5'

    if (parent.querySelector('#templates-wrapper')) {
        wrapper = parent.querySelector('#templates-wrapper')
    } else {
        parent.appendChild(wrapper)
    }

    wrapper.innerHTML = html
}

function prevPromptTemplatesPage () {
    promptTemplateSection.currentPage--
    promptTemplateSection.currentPage = Math.max(0, promptTemplateSection.currentPage)
    // Update the section
    insertPromptTemplatesSection()
}

function nextPromptTemplatesPage () {
    const templates = window.prompttemplates
    if (!templates || !Array.isArray(templates)) return

    promptTemplateSection.currentPage++
    promptTemplateSection.currentPage = Math.min(
        Math.floor(
            (templates.length - 1) /
            promptTemplateSection.pageSize
        ),
        promptTemplateSection.currentPage
    )
    // Update the section
    insertPromptTemplatesSection()
}

function addCopyButton (buttonGroup) {
    const button = document.createElement('button')
    button.onclick = () => {
        const text = buttonGroup.parentElement.innerText
        navigator.clipboard.writeText(text)
    }
    button.className = css`action`
    button.innerHTML = svg`Clipboard`
    buttonGroup.prepend(button)
}

// This function selects a prompt template
function selectPromptTemplate (idx) {
    console.log("FIRED!")
    // Get the list of prompt templates
    const templates = window.prompttemplates
    // If there are no templates, skip
    if (!templates || !Array.isArray(templates)) return

    const template = templates[idx]

    const textarea = document.querySelector('textarea')
    /*const parent = textarea.parentElement
    let wrapper = document.createElement('div')
    wrapper.id = 'prompt-wrapper'
    if (parent.querySelector('#prompt-wrapper')) {
        wrapper = parent.querySelector('#prompt-wrapper')
    } else {
        parent.prepend(wrapper)
    }*/

    if (template) {
        console.log(template)
        /*wrapper.innerHTML = `
    <span class="${css`tag`}">
      ${template.title}
    </span>
    `*/
        textarea.focus()
        function setText() {
            textarea.value = template.text
            textarea.style.height = "200px"
            window.selectedprompttemplate = template
            textarea.parentElement.querySelector('button').addEventListener('click', () => {
                textarea.style.height = "24px"
            })
        }
        setTimeout(setText, 100) //timeout for weird clear thing

    }
    /*else {
        //wrapper.innerHTML = ``
        textarea.placeholder = ''
        window.selectedprompttemplate = null
    }*/
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

function svg (name) {
    name = Array.isArray(name) ? name[0] : name
    switch (name) {
        case 'Archive': return '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" height="1em" <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>'
        case 'ChatBubble': return '<svg stroke="currentColor" fill="none" stroke-width="1.5" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 m-auto" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>'
        case 'Clipboard': return '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>'
    }
}

function css (name) {
    name = Array.isArray(name) ? name[0] : name
    switch (name) {
        case 'column': return 'flex flex-col gap-3.5 flex-1'
        case 'h2': return 'text-lg font-normal">Prompt Templates</h2><ul class="flex flex-col gap-3.5'
        case 'h3': return 'm-0 tracking-tight leading-8 text-gray-900 dark:text-gray-100 text-xl'
        case 'ul': return 'flex flex-col gap-3.5'
        case 'card': return 'flex flex-col gap-2 w-full bg-gray-50 dark:bg-white/5 p-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-900 text-left'
        case 'p': return 'm-0 font-light text-gray-500'
        case 'paginationText': return 'text-sm text-gray-700 dark:text-gray-400'
        case 'paginationNumber': return 'font-semibold text-gray-900 dark:text-white'
        case 'paginationButtonGroup': return 'inline-flex mt-2 xs:mt-0'
        case 'paginationButton': return 'px-4 py-2  font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white'
        case 'action': return 'p-1 rounded-md hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:invisible md:group-hover:visible'
        case 'tag': return 'inline-flex items-center py-1 px-2 mr-2 mb-2 text-sm font-medium text-white rounded bg-gray-600 whitespace-nowrap'
    }
}

let prompts_url = window.location.href;

function check_url() {
    if (prompts_url !== window.location.href) {
        prompts_url = window.location.href;
        let newChatButton = document.querySelector('nav').firstChild
        newChatButton.addEventListener('click', () => {
            setTimeout(insertPromptTemplatesSection, 300)
        })
        console.log("URL CHANGE")
    }
}

setInterval(check_url, 500);