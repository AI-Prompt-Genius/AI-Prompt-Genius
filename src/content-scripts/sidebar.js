async function getPrompts() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get({'prompts': []}, function (data) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }
            else {
                resolve(data.prompts.reverse()); // returning reverse because of bad setup; means you should set reverse as well
            }
        });
    });
}

async function getTranslations() {
    return new Promise(async (resolve) => {
        chrome.storage.local.get({ lang: "en" }, async function (result) {
            console.log("inserting!");
            const lang = result.lang ?? "en";
            const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
            const response = await fetch(url);
            const translations = await response.json();
            resolve(translations);
        });
    });
}
async function main() {
    let prompts = await getPrompts()
    const translations = await getTranslations()
    console.log(await translations)
    const t = await translations
    const promptBar = // styles from chatbotui.com (MIT - Mckay Wrigley)
        `
<div id="prompt-bar" class="flex h-full flex-1 flex-col space-y-1 p-2" style="position:fixed; z-index: 1; right:0; width:260px; background-color: #202123">
  <div class="flex items-center">
    <button id="newPromptPg" style="width: 100%;" class="flex text-white text-sm flex-shrink-0 items-center gap-3 rounded-md border hover:bg-gray-500/10 border-white/20 p-3 text-white">
      ${svg("plus")} ${tr("new_prompt", t)}</button>
    <!--button class="flex items-center flex-shrink-0 gap-3 p-3 ml-2 text-sm text-white transition-colors duration-200 border rounded-md cursor-pointer border-white/20 hover:bg-gray-500/10">
      $ {svg("folder")}
    </button-->
  </div>
  <div class="relative flex items-center">
    <input class="w-full flex-1 rounded-md border border-white/20 px-4 py-3 pr-10 text-[14px] leading-3 text-white" type="text" placeholder='${tr("search_prompts", t)}' value="" style="background-color: #202123">
  </div>
  <div id="scroll-prompts" class="flex-grow dark" style="overflow: scroll!important;">
    <div class="pt-2">
      <div class="flex w-full flex-col gap-1" id="sidebarPrompts">
        <!--begin prompt column template-->
        ${prompts.map((prompt) => `
            <div class="relative flex items-center">
                <button data-prompt-id="${prompt.id}" class="edit-prompts pgbtn flex w-full text-white cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-500/10">
                    ${svg("lightbulb")}
                    <div data-prompt-id2="${prompt.id}" style="font-size: 12.5px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 165px" class="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all pr-4 text-left text-[12.5px] leading-3">${prompt.title}</div>
                </button>
                <div class="absolute right-1 z-10 flex text-gray-300">
                    <button data-prompt-id3="${prompt.id}" style="min-width: 20px" class="p-1 can text-neutral-400 svg-hover">
                        ${svg('trash')}
                    </button>
                </div>
            </div>`).join(" ")}
        <!-- end prompt column template-->
      </div>
    </div>
  </div>
</div>
<button id="closePrompt" style="position: absolute; z-index: 1; bottom: 0; right: 259px; background-color: #202123; width: 28px; height: 28px; color: white; border-top-left-radius: 5px; border-bottom-left-radius: 3px;">></button>
`
    let nav = document.querySelector("#__next").querySelectorAll("div")[1].firstChild
    const chatInput = document.querySelector("textarea")
    const mainPar = document.querySelector("main").parentElement
    const closeNavButton = `<button id="closeNav" style="position: absolute; z-index: 1; bottom: 0; left: 259px; background-color: #202123; width: 28px; height: 28px; color: white; border-top-right-radius: 5px; border-bottom-right-radius: 3px;"><</button>`
    nav.insertAdjacentHTML("afterend", promptBar)
    nav.insertAdjacentHTML("afterend", closeNavButton)
    const closeNavBut = document.getElementById("closeNav")
    mainPar.style.marginRight = "220px";

    function addStyles(){
        const styles = `<style>.pgbtn:hover{background-color: rgba(52,53,65,.9)} .svg-hover:hover{color: #F5F5F5!important;}</style>`;
        console.log(styles);
        document.head.insertAdjacentHTML("beforeend", styles);
    }
    addStyles();

    function updateNav(){
        if (document.querySelector("nav")){
            nav = document.querySelector("#__next").querySelectorAll("div")[1].firstChild
            closeNavBut.style.display = "block"
        }
        else {
            nav = document.querySelector("#__next").querySelectorAll("div")[1]
            closeNavBut.style.display = "none"
        }
    }

    async function newBlank(){
        prompts = await getPrompts()
        let prompt = {
            date: getDate(),
            time: getTime(),
            id: generateUUID(),
            title: "Untitled Prompt",
            text: "",
            tags: [],
            category: "",
            lastChanged: new Date().getTime()
        }
        prompts.unshift(prompt)
        chrome.storage.local.set({prompts: prompts.reverse()})
        const html = `<div class="relative flex items-center">
                <button data-prompt-id="${prompt.id}" class="edit-prompts pgbtn flex w-full text-white cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-500/10">
                    ${svg("lightbulb")}
                    <div data-prompt-id2="${prompt.id}" style="font-size: 12.5px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 165px" class="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all pr-4 text-left text-[12.5px] leading-3">${prompt.title}</div>
                </button>
                <div class="absolute right-1 z-10 flex text-gray-300">
                    <button style="min-width: 20px" class="p-1 text-neutral-400 svg-hover">
                        ${svg('trash')}
                    </button>
                </div>
            </div>`
        const promptList = document.getElementById("sidebarPrompts")
        promptList.insertAdjacentHTML("afterbegin", html)
        document.querySelector(".edit-prompts").addEventListener("click", (event) => {
            let t = event.target
            while (!t.dataset.promptId){
                t = t.parentElement
            }
            let promptId = t.dataset.promptId; // Get the data-prompt-id value
            console.log("CLICK!")
            editPrompt(promptId); // Pass the promptId as a parameter to editPrompt function
        });
    }

    // Attach an event listener to the window object for the "resize" event
    window.addEventListener('resize', function(event) {
        // Code to be executed when the window is resized
        updateNav()
    });

    function toggleNav() {
        const hidden = nav.style.display === "none"
        if (hidden) {
            nav.style.display = "block"
            closeNavBut.style.left = "259px"
            closeNavBut.innerHTML = "<"
        } else {
            nav.style.display = "none"
            closeNavBut.style.left = "0"
            closeNavBut.innerHTML = ">"
        }
    }

    async function editPrompt(id){
        console.log(id)
        prompts = await getPrompts()
        let prompt = prompts[getObjectIndexByID(id, prompts)]
        console.log(prompt)
        const tags = prompt.tags ? prompt.tags.join(",") : "";
        const html = getPromptModal(prompt.id, prompt?.title ?? "", prompt?.text ?? "", tags)
        document.body.insertAdjacentHTML("beforeend", html)
        document.getElementById("prompt-category").value = prompt?.category ?? ""
        document.getElementById("save-prompt").addEventListener("click", () => updatePrompt(id))
    }

    async function updatePrompt(id) {
        console.log("updating prompt " + id)
        prompts = await getPrompts();
        let promptIndex = getObjectIndexByID(id, prompts);
        let title;
        if (promptIndex !== -1) { // Ensure a valid index is returned by getObjectIndexByID function
            title = document.getElementById("prompt-name").value
            prompts[promptIndex].title = title;
            console.log(document.getElementById("prompt-text").value)
            prompts[promptIndex].text = document.getElementById("prompt-text").value;
            prompts[promptIndex].tags = document.getElementById("prompt-tags").value.split(",").filter(tag => tag !== "");
            prompts[promptIndex].category = document.getElementById("prompt-category").value;
            prompts[promptIndex].lastChanged = new Date().getTime()
            console.log(prompts)
            chrome.storage.local.set({prompts: prompts.reverse()});
        }
        chrome.storage.local.get({"changedPrompts": []}, function (result){
            let changedPrompts = result.changedPrompts
            if (!changedPrompts.includes(id)){
                changedPrompts.push(id)
                chrome.storage.local.set({"changedPrompts": changedPrompts})
            }
        })
        document.getElementById("prompt-modal").remove()
        const btn = document.querySelector(`[data-prompt-id2='${id}']`)
        btn.innerHTML = title
    }

    function deletePrompt(id, el) {
        console.log(id)
        chrome.storage.local.get({"deletedPrompts": []}, function (result){
            let dp = result.deletedPrompts;
            dp.push(id)
            chrome.storage.local.set({"deletedPrompts": dp});
        });
        chrome.storage.local.get({prompts: []}, function (result) {
            prompts = result.prompts;
            let prompt = prompts[getObjectIndexByID(id, prompts)];
            if(!prompt)
            {
                console.warn(`toggle_prompt_editable: cannot find prompt of id ${id}.`);
                return;
            }
            removeElementInArray(prompts, prompt);
            chrome.storage.local.set({prompts: prompts});
        });
        el.remove()
    }

    function addEvents(){
        let ep = document.querySelectorAll(".edit-prompts");
        for (const prompt of ep) {
            prompt.addEventListener("click", (event) => {
                let t = event.target
                while (!t.dataset.promptId){
                    t = t.parentElement
                }
                let promptId = t.dataset.promptId; // Get the data-prompt-id value
                editPrompt(promptId); // Pass the promptId as a parameter to editPrompt function
            });
        }
        let trashCans = document.querySelectorAll(".can")
        for (const can of trashCans){
            can.addEventListener("click", (event) => {
                let t = event.target
                while (!t.dataset.promptId3){
                    t = t.parentElement
                }
                let promptID = t.dataset.promptId3
                deletePrompt(promptID, t.parentElement.parentElement)
            })
        }
    }
    addEvents()

    function getPromptModal(id="", name="", text="", tags=""){
        const template = `
    <div id="prompt-modal" data-prompt-id="${id}" style="z-index: 100; background-color: rgb(0 0 0/.5)" class="fixed inset-0 flex items-center justify-center bg-opacity-50 z-100">
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true"></div>
          <div class="dark:bg-gray-900 dark:text-gray-200 dark:border-netural-400 inline-block max-h-[400px] transform overflow-hidden rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle" role="dialog">
            <div class="text-sm font-bold text-black dark:text-gray-200">${tr("name", t)}</div>
            <input style="border-color: #8e8ea0" id="prompt-name" value="${name}" class="my-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-gray-800 dark:text-neutral-100" placeholder="A name for your prompt." value="">
            <div class="my-2 text-sm font-bold text-black dark:text-gray-200">${tr("prompt", t)}</div>
            <textarea style="border-color: #8e8ea0" id="prompt-text" class="my-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-gray-800 dark:text-neutral-100" placeholder="Prompt content. Use {{}} to denote a variable. Ex: {{name}} is a {{adjective}} {{noun}}" rows="10" style="resize: none;" spellCheck="false">${text}</textarea>
            <div class="text-sm font-bold text-black dark:text-gray-200">${tr("tags", t)}</div>
            <input style="border-color: #8e8ea0" id="prompt-tags" value="${tags}" class="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-gray-800 dark:text-neutral-100" placeholder="Tags for your prompt. Separate with a comma." value="">
            <div class="my-2 text-sm font-bold text-black dark:text-gray-200">${tr("category", t)}</div>
            <div class="">
              <select id="prompt-category" class="dark:bg-gray-800 border border-neutral-500 text-sm rounded block w-full">
                <option value="" data-i18n="all_categories">Select</option>
                <option value="Academic Writing" data-i18n="category_academic_writing">Academic Writing</option>
                <option value="Bypass & Personas" data-i18n="category_bypass_personas">Bypass &amp; Personas</option>
                <option value="Education & Learning" data-i18n="category_education_learning">Education &amp; Learning</option>
                <option value="Expert/Consultant" data-i18n="category_expert_consultant">Expert/Consultant</option>
                <option value="Fun & Games" data-i18n="category_fun_games">Fun &amp; Games</option>
                <option value="Fitness, Nutrition, & Health" data-i18n="category_fitness_nutrition_health">Fitness, Nutrition, &amp; Health</option>
                <option value="Fiction Writing" data-i18n="category_fiction_writing">Fiction Writing</option>
                <option value="Music" data-i18n="category_music">Music</option>
                <option value="Nonfiction Writing" data-i18n="category_nonfiction_writing">Nonfiction Writing</option>
                <option value="Other" data-i18n="category_other">Other</option>
                <option value="Philosophy & Logic" data-i18n="category_philosophy_logic">Philosophy &amp; Logic</option>
                <option value="Poetry" data-i18n="category_poetry">Poetry</option>
                <option value="Programming & Technology" data-i18n="category_programming_technology">Programming &amp; Technology</option>
                <option value="Speeches & Scripts" data-i18n="category_speeches_scripts">Speeches &amp; Scripts</option>
                <option value="Social Media & Blogging" data-i18n="category_social_media_blogging">Social Media &amp; Blogging</option>
                <option value="Travel" data-i18n="category_travel">Travel</option>
                <option value="Therapy & Life-help" data-i18n="category_therapy_life_help">Therapy &amp; Life-help</option>
              </select>
            </div>
            <!--div class="mt-6 text-sm font-bold text-black dark:text-gray-200">$ {tr("description", t)}</div><textarea
                            class="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-gray-800 dark:text-neutral-100"
                            placeholder="A description for your prompt." rows="3" style="resize: none;"></textarea-->
            <button id="save-prompt" type="button" class="w-full px-4 py-2 mt-6 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-gray-800">Save </button>
          </div>
        </div>
      </div>
    </div>
    `
        return template
    }

    const textDiv = chatInput.parentElement
    let autocomplete = false;
    let focusedIdx = 0;

    function selectPrompt(id){
        const promptText = prompts.find(prompt => prompt.id === id)?.text;
        const searchTerm = chatInput.value.substring(chatInput.value.lastIndexOf('/') + 1).split(' ')[0];
        const lastSlashIndex = chatInput.value.lastIndexOf('/');
        const lastSearchTermIndex = lastSlashIndex + searchTerm.length + 1;
        removeSuggestion();
        chatInput.style.height = "200px"
        chatInput.parentElement.querySelector('button').addEventListener('click', () => {
            chatInput.style.height = "24px"
        })
        const newText = chatInput.value.substring(0, lastSlashIndex) + promptText + chatInput.value.substring(lastSearchTermIndex);
        chatInput.value = newText;
        autocomplete = false;
    }

    function autoComplete(event) {
        // If keydown is a backslash / character, do this
        if (event.key === '/' && !autocomplete) {
            // Set a flag to indicate that autoComplete was triggered by the slash
            autocomplete = true;
            getSuggestedPrompts("")
            focusedIdx = 0
            focusEl(focusedIdx)
        }
        // If space is pressed, remove autoComplete suggestions and reset the autoComplete flag
        else if (event.key === ' ' || (event.key === 'Backspace' && chatInput.value.lastIndexOf('/') === -1)) {
            autocomplete = false;
            removeSuggestion()
        }
        else if (autocomplete && event.key === "Enter"){
            selectFocused()
            event.preventDefault()
            event.stopImmediatePropagation()
            event.stopPropagation()
            return false;
        }
        else if (autocomplete && event.key === "ArrowUp"){
            event.preventDefault()
            event.stopImmediatePropagation()
            if (focusedIdx > 0){
                focusedIdx -= 1
                const focused = focusEl(focusedIdx)
                focused.scrollIntoView({ behavior: "instant", block: "nearest", inline: "start"})
            }
        }
        else if (autocomplete && event.key === "ArrowDown"){
            event.preventDefault()
            event.stopImmediatePropagation()
            const searchTerm = chatInput.value.substring(chatInput.value.lastIndexOf('/') + 1).split(' ')[0];
            let filtered = prompts.filter(prompt => prompt.title.toLowerCase().includes(searchTerm.toLowerCase()));
            if (focusedIdx < filtered.length - 1){
                focusedIdx += 1
                const focused = focusEl(focusedIdx)
                focused.scrollIntoView({ behavior: "instant", block: "nearest", inline: "start"})
            }
        }
        // If autoComplete was triggered and a non-space character is pressed, process autoComplete
        else if (autocomplete && event.key !== ' ') {
            const searchTerm = chatInput.value.substring(chatInput.value.lastIndexOf('/') + 1).split(' ')[0];
            textDiv.querySelector("button").disabled = true // weird jerry rig to stop form from submitting
            console.log(searchTerm)
            removeSuggestion()
            getSuggestedPrompts(searchTerm)
            focusedIdx = 0
            focusEl(focusedIdx)
        }
        //}
        // Else, return
        else {
            return;
        }
    }

    function selectFocused(){
        const focused = document.querySelector(".autocomplete-active")
        if (focused){
            const promptId = focused.getAttribute("data-prompt-id4")
            selectPrompt(promptId)
        }
        removeSuggestion();
    }

    function preventEnter(event){
        if (event.key === "Enter" && autocomplete && document.querySelector(".autocomplete-active")){
            console.warn("PREVENING!")
            textDiv.querySelector("button").disabled = true // weird jerry rig to stop form from submitting
            event.preventDefault()
            event.stopPropagation()
            return false;
        }
    }

    function focusEl(idx) {
        document.querySelectorAll(".pg-suggestion").forEach(each => each.classList.remove("autocomplete-active"));
        const focusedEl = document.querySelectorAll(".pg-suggestion")[idx]
        focusedEl?.classList.add("autocomplete-active")
        return focusedEl
    }

    const autocompleteStyles =
    `
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

    function updatePlaceholder(){
        const placeholder = tr("placeholder", t)
        document.querySelector("textarea").placeholder = placeholder
    }
    updatePlaceholder()

    function removeSuggestion() {
        const suggestionElement = document.querySelector('.suggestions');
        if (suggestionElement) {
            suggestionElement.remove();
        }
    }

    chatInput.addEventListener("keyup", autoComplete, {capture: true});
    chatInput.addEventListener("keydown", preventEnter, {capture: true})
    chatInput.addEventListener("keypress", preventEnter, {capture: true})



    function getSuggestedPrompts(searchTerm) {
        let filtered = prompts.filter(prompt => prompt.title.toLowerCase().includes(searchTerm.toLowerCase()));
        const html =
            `
        <div id="suggestions" class="w-full suggestions" style="position: relative">
            <ul id="scrollSuggest" class="dark:border-white/2 rounded border-black/10 dark:bg-gray-700" style="font-size: .875rem; line-height: 1.25rem; color: rgb(255 255 255); box-sizing: border-box; list-style: none; margin: 0; padding: 0; z-index: 10; max-height: 13rem; width: 100%; overflow: auto; ">
                ${filtered.map((prompt, idx) => `
                <li data-idx="${idx}" data-prompt-id4="${prompt.id}" class="cursor-pointer dark:bg-gray-700 pg-suggestion px-3 py-2 text-sm text-black dark:text-white">${prompt.title}</li>
                `).join("")}
            </ul>
        </div>
        `
        textDiv.insertAdjacentHTML("beforebegin", html)
        const suggestions = document.querySelectorAll(".pg-suggestion")
        suggestions.forEach(s => s.addEventListener("mouseenter", () => focusEl(s.getAttribute("data-idx"))));
        suggestions.forEach(s => s.addEventListener("mouseup", () => selectPrompt(s.getAttribute("data-prompt-id4"))));
    }



    function togglePrompt() {
        const myNav = document.getElementById("prompt-bar")
        const hidden = myNav.style.display === "none"
        const closePrompt = document.getElementById("closePrompt")
        if (hidden) {
            myNav.style.display = "block"
            myNav.querySelector("#scroll-prompts").overflow = "scroll"
            closePrompt.style.right = "259px"
            closePrompt.innerHTML = ">"
            mainPar.style.marginRight = "259px"
        } else {
            myNav.style.display = "none"
            closePrompt.style.right = "0"
            closePrompt.innerHTML = "<"
            mainPar.style.marginRight = "0"
        }

    }

    document.getElementById("closeNav").addEventListener("click", toggleNav)
    document.getElementById("closePrompt").addEventListener("click", togglePrompt)
    document.getElementById("newPromptPg").addEventListener("click", newBlank)
    chatInput.addEventListener("change", autoComplete)
}
main()

function svg(name){
    switch(name){
        case "lightbulb" : return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-bulb-filled"><path d="M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" fill="currentColor" stroke-width="0"></path><path d="M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z" fill="currentColor" stroke-width="0"></path><path d="M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" fill="currentColor" stroke-width="0"></path><path d="M4.893 4.893a1 1 0 0 1 1.32 -.083l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 0 -1.414z" fill="currentColor" stroke-width="0"></path><path d="M17.693 4.893a1 1 0 0 1 1.497 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7z" fill="currentColor" stroke-width="0"></path><path d="M14 18a1 1 0 0 1 1 1a3 3 0 0 1 -6 0a1 1 0 0 1 .883 -.993l.117 -.007h4z" fill="currentColor" stroke-width="0"></path><path d="M12 6a6 6 0 0 1 3.6 10.8a1 1 0 0 1 -.471 .192l-.129 .008h-6a1 1 0 0 1 -.6 -.2a6 6 0 0 1 3.6 -10.8z" fill="currentColor" stroke-width="0"></path></svg>`
        case "folder" : return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-folder-plus"> <path d="M12 19h-7a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v3.5"></path> <path d="M16 19h6"></path> <path d="M19 16v6"></path> </svg>`;
        case "trash" : return  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-trash"> <path d="M4 7l16 0"></path> <path d="M10 11l0 6"></path> <path d="M14 11l0 6"></path> <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path> <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path> </svg>`
        case "plus" : return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-plus"> <path d="M12 5l0 14"></path> <path d="M5 12l14 0"></path> </svg>`
    }
}

let sidebarURL = window.location.href;

function check_url() {
    if (sidebarURL !== window.location.href) {
        console.log("sidebar URL")
        sidebarURL = window.location.href;
        setTimeout(main, 300)
    }
}

setInterval(check_url, 1000);