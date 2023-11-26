async function main() {
    window.activeInput = document.activeElement
    const prompts = await chrome.storage.local.get({ currentPrompts: [] })
    document.head.insertAdjacentHTML("beforeend", styles())
    document.body.insertAdjacentHTML("beforeend", modal(prompts))
    addEvents()
}

if (!document.getElementById("modal-pg")) main()

function addEvents() {
    // Event listener for the search box
    const searchBox = document.getElementById("searchInput")
    searchBox.focus()
    searchBox.addEventListener("input", filterPrompts)

    // Event listeners for each prompt item to copy text on click
    const prompts = document.querySelectorAll(".prompt-item")
    prompts.forEach(prompt => {
        prompt.addEventListener("click", function () {
            const text = this.getAttribute("data-text")
            handlePromptSelection(text)
        })
    })

    // Event listener for arrow keys navigation
    document.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            navigatePrompts(event.key)
        }
        if (event.key === "Enter") {
            const active = document.activeElement
            if (active && active.classList.contains("prompt-item")) {
                active.click()
            }
        }
    })
    document.getElementById("modal-pg").addEventListener("click", function (event) {
        if (event.target === this) {
            cleanup()
        }
    })
}

function navigatePrompts(direction) {
    const prompts = document.querySelectorAll(".prompt-item")
    const active = document.activeElement
    const currentIndex = Array.from(prompts).indexOf(active)

    if (direction === "ArrowDown" && currentIndex < prompts.length - 1) {
        const nextElement = prompts[currentIndex + 1]
        nextElement.focus()
    } else if (direction === "ArrowUp" && currentIndex > 0) {
        const prevElement = prompts[currentIndex - 1]
        prevElement.focus()
    }
}

function handlePromptSelection(text) {
    console.log(text)
    const variableRegex = /{{(.*?)}}/g
    let match
    let variables = []
    let uniqueVariables = new Set() // Use a Set to ensure uniqueness

    // Extract unique variables from the text
    while ((match = variableRegex.exec(text)) !== null) {
        uniqueVariables.add(match[1])
    }

    // Convert the Set of variables to an Array
    variables = Array.from(uniqueVariables)

    // If no variables are present, copy text immediately
    if (variables.length === 0) {
        copyTextToClipboard(text)
        cleanup() // Clean up after copying
    } else {
        // Create a modal for the variables
        createVariableModal(variables, text)
    }
}

function modal(prompts) {
    // Generates HTML for each prompt without inline event handlers
    let promptItems = prompts.currentPrompts
        .map(
            (prompt, index) => `
    <div class="prompt-item" data-text="${prompt.text}" id="prompt-${index}" tabindex="0">
        <div class="prompt-title">${prompt.title}</div>
    </div>
`,
        )
        .join("")

    return `
        <div id="modal-pg" class="modal-pg">
            <div class="modal-content-pg">
                <input type="text" autocomplete="off" id="searchInput" placeholder="Search prompts..." class="search-input">
                <div id="promptsContainer" class="prompts-container">
                    ${promptItems}
                </div>
            </div>
        </div>
    `
}

function styles() {
    return `
    <style>
    /* Modal styling */
.modal-pg {
    display: block; 
    position: fixed; /* Stay in place */
    z-index: 10000000; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: hidden; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
    font-family: sans-serif;
}
.modal-content-pg {
    background-color: #fefefe;
    margin: 10% auto; /* 10% from the top and centered */
    padding: 20px;
    border: 1px solid #888;
    width: 80%; /* Could be more or less, depending on screen size */
    border-radius: 10px;
    height: 80%;
}
.search-input {
    height: 40px; /* Set a fixed height */
    padding: 8px 10px; /* Adjust padding as necessary */
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    width: calc(100% - 20px); /* Adjust width to account for padding */
}
.prompt-item {
    padding: 10px;
    border-bottom: 1px solid #ddd;
    cursor: pointer;
    display: flex; /* Make sure the items are flex containers */
    align-items: center; /* Align children vertically in the center */
    height: auto; /* Set height to auto */
}
.prompt-item:hover {
    background-color: #f5f5f5;
}
.prompt-title {
    font-weight: bold;
}
.prompt-text {
    color: #666;
}
.prompts-container {
    height: 80%; /* Adjust the height as necessary */
    overflow-y: auto; /* Enables scrolling within the container */
}
    /* Variable modal styling */
.variable-modal {
    display: block;
    position: fixed;
    z-index: 10000001;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.4);
    font-family: sans-serif;
}

.variable-modal-content {
    background-color: #fff;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 50%;
    border-radius: 10px;
}

.input-group {
    margin-bottom: 10px;
}

.input-label {
    display: block;
    margin-bottom: 5px;
}

.variable-input {
    width: 100%;
    padding: 8px 10px;
    margin-bottom: 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
}

.copy-button {
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.copy-button:hover {
    background-color: #0056b3;
}
</style>
    `
}

function copyTextToClipboard(text) {
    window.activeInput.focus()
    window.activeInput.value = window.activeInput.value + text
    if (window.location.href.includes("chat.openai.com") && window.activeInput.id === "prompt-textarea") {
        window.activeInput.style.height = "200px";
    }
    setTimeout(() => window.activeInput.focus(), 100)
    navigator.clipboard.writeText(text).then(
        function () {
            //console.log('Async: Copying to clipboard was successful!');
        },
        function (err) {
            console.error("Async: Could not copy text: ", err)
        },
    )
}

function filterPrompts() {
    let input = document.getElementById("searchInput")
    let filter = input.value.toLowerCase()
    let promptsContainer = document.getElementById("promptsContainer")
    let prompts = promptsContainer.getElementsByClassName("prompt-item")
    let firstVisible = null

    for (let i = 0; i < prompts.length; i++) {
        let title = prompts[i].getElementsByClassName("prompt-title")[0]
        if (title.innerText.toLowerCase().indexOf(filter) > -1) {
            prompts[i].style.display = ""
            if (!firstVisible) firstVisible = prompts[i]
        } else {
            prompts[i].style.display = "none"
        }
    }
}

function createVariableModal(variables, text) {
    document.getElementById("modal-pg").style.display = "none"
    // Generate HTML for variable inputs
    let variableInputs = variables
        .map(
            variable => `
        <div class="input-group">
            <label class="input-label">${variable}</label>
            <input type="text" placeholder="Enter value for ${variable}..." class="variable-input" id="input-${variable}">
        </div>
    `,
        )
        .join("")

    // Create the modal HTML
    let variableModalHTML = `
        <div id="variable-modal" class="variable-modal">
            <div class="variable-modal-content">
                ${variableInputs}
                <button id="copyButton" class="copy-button">COPY</button>
            </div>
        </div>
    `

    // Insert the modal into the DOM
    document.body.insertAdjacentHTML("beforeend", variableModalHTML)

    // Focus on the first input
    document.querySelector(".variable-input").focus()

    // Add event listener for the COPY button
    document.getElementById("copyButton").addEventListener("click", () => copyVariableText(text))
}

function copyVariableText(text) {
    let variableValues = {}
    document.querySelectorAll(".variable-input").forEach(input => {
        let variableName = input.id.replace("input-", "")
        variableValues[variableName] = input.value
    })

    console.log(variableValues)
    console.log(text)

    // Replace variables in the original text and copy to clipboard
    for (const [variable, value] of Object.entries(variableValues)) {
        text = text.replace(new RegExp(`{{${variable}}}`, "g"), value)
    }

    // Copy the text to clipboard
    copyTextToClipboard(text)
    // Cleanup after copying
    cleanup()
}

function isInputElement(element) {
    return element.tagName.toLowerCase() === "input" || element.tagName.toLowerCase() === "textarea"
}

function cleanup() {
    // Remove the variable modal
    const variableModal = document.getElementById("variable-modal")
    if (variableModal) {
        variableModal.parentNode.removeChild(variableModal)
    }

    // Remove the search modal if it exists
    const searchModal = document.getElementById("modal-pg")
    if (searchModal) {
        searchModal.parentNode.removeChild(searchModal)
    }

    // Remove event listeners
    document.removeEventListener("keydown", navigatePrompts)
    // Remember to remove any other event listeners you have added
}
