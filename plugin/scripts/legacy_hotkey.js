async function main(prompts) {
    console.log(prompts)
    const chatInput = document.getElementById("prompt-textarea")
    let textDiv = chatInput.parentElement
    let autocomplete = false
    let focusedIdx = 0

    function findVariables(str) {
        // thanks chatgpt
        const regex = /{{(.+?)}}/g
        const matches = new Set()
        let match
        while ((match = regex.exec(str))) {
            matches.add(match[1])
        }
        return Array.from(matches)
    }

    function replaceVariables(str, values) {
        // thanks chatgpt
        const variables = findVariables(str)
        variables.forEach((variable, index) => {
            const value = values[index % values.length]
            const regex = new RegExp(`{{${variable}}}`, "g")
            str = str.replace(regex, value)
        })
        return str
    }

    async function getVarsFromModal(varArray, promptText) {
        const template = `  
        <div id="var-modal" style="z-index: 100; background-color: rgb(0 0 0/.5)" class="fixed pg-outer items-center inset-0 flex items-center justify-center bg-opacity-50 z-100">
          <div class="fixed inset-0 z-10 overflow-y-auto pg-outer">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block pg-outer">
              <div style="width: 60%" class="dark:bg-gray-900 dark:text-gray-200 dark:border-netural-400 inline-block max-h-[ma400px] transform overflow-hidden rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:p-6 sm:align-middle" role="dialog">
            ${varArray
                .map(
                    variable => `
                <div class="text-sm font-bold text-black dark:text-gray-200">${variable}</div>
                <textarea style="border-color: #8e8ea0; height: 45px" class="pg-variable my-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-gray-800 dark:text-neutral-100" 
                placeholder="${chrome.i18n.getMessage(
                    "enter_val",
                )} ${variable}..." value=""></textarea>
                `,
                )
                .join("")}
                <button id="save-vars" type="button" class="w-full px-4 py-2 mt-6 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-gray-800">${chrome.i18n.getMessage(
                    "submit",
                )}</button>   
              </div>
            </div>
          </div>
        </div>
        `
        document.body.insertAdjacentHTML("beforeend", template)
        document.querySelector(".pg-variable").focus()
        function handleKeyDown(event) {
            if ((event.key === "Enter" || event.keyCode === 13) && !event.shiftKey) {
                submitModal()
                document.removeEventListener("keydown", handleKeyDown)
            }
        }

        function handleClick(e) {
            if (e.target.classList.contains("pg-outer")) {
                closeModal()
            }
        }

        function closeModal() {
            const modal = document.getElementById("var-modal")
            if (modal) modal.remove()
        }

        document.querySelectorAll(".pg-outer").forEach(div => {
            div.addEventListener("click", e => handleClick(e))
        })

        document.addEventListener("keydown", handleKeyDown)
        document.getElementById("save-vars").addEventListener("click", submitModal)
        function submitModal() {
            const varInputs = document.querySelectorAll(".pg-variable")
            let variables = []
            for (const varIn of varInputs) {
                variables.push(varIn.value)
            }
            document.getElementById("var-modal").remove()
            selectPrompt(replaceVariables(promptText, variables), false)
            setTimeout(() => chatInput.focus(), 80) // so not to add a newline
        }
    }

    async function selectPrompt(promptText, hasVars = true) {
        let chatInput = document.getElementById("prompt-textarea")
        removeSuggestion()
        const vars = hasVars ? findVariables(promptText) : [] // so if the chosen variable has a variable within {{}}
        if (vars.length > 0) {
            getVarsFromModal(vars, promptText)
            return ""
        }
        const searchTerm = chatInput.value
            .substring(chatInput.value.lastIndexOf("/") + 1)
            .split(" ")[0]
        const lastSlashIndex = chatInput.value.lastIndexOf("/")
        const lastSearchTermIndex = lastSlashIndex + searchTerm.length + 1
        const submit_btn = chatInput.parentElement.parentElement.querySelector("button")
        if (submit_btn) {
            chatInput.style.height = "200px"
            submit_btn.addEventListener("click", () => {
                chatInput.style.height = "24px"
            })
        }
        const newText =
            chatInput.value.substring(0, lastSlashIndex) +
            promptText +
            chatInput.value.substring(lastSearchTermIndex)
        console.log(newText)
        chatInput.value = newText
        autocomplete = false
    }

    let lastKey = ""
    function autoComplete(event) {
        //console.log(lastKey)
        //console.log(event)
        if (!(event.target.id === "prompt-textarea")) {
            return true
        }
        // If keydown is a backslash / character, do this
        else if (event.key === "/" && lastKey !== "Shift" && !autocomplete) {
            // Set a flag to indicate that autoComplete was triggered by the slash
            autocomplete = true
            removeSuggestion()
            getSuggestedPrompts("")
            focusedIdx = 0
            focusEl(focusedIdx)
        }
        // If space is pressed, remove autoComplete suggestions and reset the autoComplete flag
        else if (
            event.key === " " ||
            (event.key === "Backspace" && chatInput.value.lastIndexOf("/") === -1)
        ) {
            autocomplete = false
            removeSuggestion()
        } else if (autocomplete && event.key === "Enter") {
            selectFocused()
            event.preventDefault()
            event.stopImmediatePropagation()
            event.stopPropagation()
            lastKey = event?.key ?? ""
            return false
        } else if (autocomplete && event.key === "ArrowUp") {
            event.preventDefault()
            event.stopImmediatePropagation()
            event.stopPropagation()
            if (focusedIdx > 0) {
                focusedIdx -= 1
                const focused = focusEl(focusedIdx)
                focused.scrollIntoView({
                    behavior: "instant",
                    block: "nearest",
                    inline: "start",
                })
            }
            lastKey = event?.key ?? ""
            return false
        } else if (autocomplete && event.key === "ArrowDown") {
            event.preventDefault()
            event.stopImmediatePropagation()
            event.stopPropagation()
            const searchTerm = chatInput.value
                .substring(chatInput.value.lastIndexOf("/") + 1)
                .split(" ")[0]
            let filtered = prompts.filter(prompt =>
                prompt.title.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            if (focusedIdx < filtered.length - 1) {
                focusedIdx += 1
                const focused = focusEl(focusedIdx)
                focused.scrollIntoView({
                    behavior: "instant",
                    block: "nearest",
                    inline: "start",
                })
            }
            lastKey = event?.key ?? ""
            return false
        }
        // If autoComplete was triggered and a non-space character is pressed, process autoComplete
        else if (autocomplete && event.key !== " " && event.type !== "change") {
            const searchTerm = chatInput.value
                .substring(chatInput.value.lastIndexOf("/") + 1)
                .split(" ")[0]
            //textDiv.querySelector("button").disabled = true; // weird jerry rig to stop form from submitting
            //console.log(searchTerm)
            removeSuggestion()
            getSuggestedPrompts(searchTerm)
            focusedIdx = 0
            focusEl(focusedIdx)
        }
        //}
        // Else, return
        else {
            lastKey = event?.key ?? ""
            return true
        }
        lastKey = event?.key ?? ""
    }

    function selectFocused() {
        const focused = document.querySelector(".autocomplete-active")
        if (focused) {
            const promptId = focused.getAttribute("data-prompt-id4")
            selectPrompt(prompts.find(prompt => prompt.id === promptId)?.text)
        }
        removeSuggestion()
    }

    function preventEnter(event) {
        if (
            event.key === "Enter" &&
            autocomplete &&
            document.querySelector(".autocomplete-active")
        ) {
            //textDiv.querySelector("button").disabled = true; // weird jerry rig to stop form from submitting
            event.preventDefault()
            event.stopPropagation()
            return false
        } else if ((event.key === "ArrowUp" || event.key === "ArrowDown") && autocomplete) {
            event.preventDefault()
            event.stopPropagation()
        }
    }

    function focusEl(idx) {
        document
            .querySelectorAll(".pg-suggestion")
            .forEach(each => each.classList.remove("autocomplete-active"))
        const focusedEl = document.querySelectorAll(".pg-suggestion")[idx]
        focusedEl?.classList.add("autocomplete-active")
        return focusedEl
    }

    const autocompleteStyles = `
    <style>

    .autocomplete-active {
        /*when navigating through the items using the arrow keys:*/
        background-color: #0BA37F;
        color: #ffffff;
    }
    .dark .autocomplete-active {
        background-color: #2A2B32 !important;
    }
    </style>
    `
    document.head.insertAdjacentHTML("beforeend", autocompleteStyles)

    const placeholder = chrome.i18n.getMessage("placeholder")
    function updatePlaceholder() {
        document.querySelector("#prompt-textarea").placeholder = placeholder
    }
    updatePlaceholder()

    function removeSuggestion() {
        const suggestionElement = document.querySelector(".suggestions")
        if (suggestionElement) {
            suggestionElement.remove()
        }
    }

    function getSuggestedPrompts(searchTerm) {
        let filtered = prompts.filter(prompt =>
            prompt.title.toLowerCase().includes(searchTerm.toLowerCase()),
        )

        // Sort the filtered prompts - thanks gpt-4
        if (searchTerm !== "") {
            filtered.sort((a, b) => {
                const aTitle = a.title.toLowerCase()
                const bTitle = b.title.toLowerCase()
                const searchTermLower = searchTerm.toLowerCase()

                if (aTitle.startsWith(searchTermLower) && !bTitle.startsWith(searchTermLower)) {
                    return -1
                } else if (
                    !aTitle.startsWith(searchTermLower) &&
                    bTitle.startsWith(searchTermLower)
                ) {
                    return 1
                } else {
                    return aTitle.localeCompare(bTitle)
                }
            })
        }

        const html = `
        <div id="suggestions" class="w-full suggestions" style="position: relative">
            <ul id="scrollSuggest" class="rounded bg-white dark:bg-gray-700" style="border-color: rgba(0,0,0,.1); border-width: 1px; font-size: .875rem; line-height: 1.25rem; color: rgb(255 255 255); box-sizing: border-box; list-style: none; margin: 0; padding: 0; z-index: 1; max-height: 13rem; width: 100%; overflow: auto; ">
                ${filtered
                    .map(
                        (prompt, idx) => `
                <li data-idx="${idx}" data-prompt-id4="${prompt.id}" class="cursor-pointer dark:bg-gray-700 pg-suggestion px-3 py-2 text-sm text-black dark:text-white">${prompt.title}</li>
                `,
                    )
                    .join("")}
            </ul>
        </div>
        `
        textDiv.parentElement.insertAdjacentHTML("beforebegin", html)
        const suggestions = document.querySelectorAll(".pg-suggestion")
        suggestions.forEach(s =>
            s.addEventListener("mouseenter", () => focusEl(s.getAttribute("data-idx"))),
        )
        suggestions.forEach(s =>
            s.addEventListener("mouseup", () =>
                selectPrompt(
                    prompts.find(prompt => prompt.id === s.getAttribute("data-prompt-id4"))?.text,
                ),
            ),
        )
    }

    function chatInputEvents() {
        document.addEventListener("keyup", autoComplete, { capture: true })
        document.addEventListener("keydown", preventEnter, { capture: true })
        document.addEventListener("keypress", preventEnter, { capture: true })
    }
    chatInputEvents()

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.type === "c_use_prompt") {
            setTimeout(() => selectPrompt(request.prompt), 1200)
        }
    })

    function checkTextBoxDefault() {
        // detects when page has changed
        if (document.getElementById("prompt-textarea").placeholder !== placeholder) {
            let suggestions = document.getElementById("suggestions")
            function remove() {
                if (suggestions) suggestions.remove()
            }
            setTimeout(remove, 300)
            clearInterval(textBoxInterval)
            main(prompts)
        }
    }
    const textBoxInterval = setInterval(checkTextBoxDefault, 1000)
}
async function wrapper() {
    const { currentPrompts } = await chrome.storage.local.get({ currentPrompts: null })
    if (currentPrompts !== null) {
        setTimeout(() => main(currentPrompts), 500)
    }
}
wrapper()
