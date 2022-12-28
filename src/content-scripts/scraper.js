let firefox = true;
if (typeof browser === "undefined") {
    browser = chrome
    firefox = false
}
function main() {
    console.log("Loading content script, everything is fine and dandy!");
    let p = document.querySelector("main > div > div > div > div")
    let c;
// loop through c to see if they are p elements or pre elements
    let page = []
    let first_time = true
    let id = "";
    document.body.appendChild(document.createElement(`div`)).setAttribute("id", "chat_history");
    let history_box = document.querySelector("#chat_history");

    //<polyline points="15 18 9 12 15 6">
    //<polyline points="9 18 15 12 9 6">
    /*
        The way that this new state works is by constantly updating and filling in the gaps.
        The length of an autosave should be short enough that in the time the user is flipping through the HTML,
            they should traverse ALL of the possible nodes without us having to add listeners.
     */
    let mirror_branch_state;
    mirror_branch_state = new TreeNode();

    /*
        mirror the state in a non-binary tree
        we use a class for convenience and namespace;
        to export to JSON, use the dedicated .toJSON() function
     */
    function TreeNode(data)
    {
        this.leaves = [];
        this.data = data;
        // instance
        this.currentLeafIndex = -1;
    }

    TreeNode.prototype.getData = function()
    {
        return this.data;
    }

    TreeNode.prototype.getCurrentLeaf = function()
    {
        return this.leaves[this.currentLeafIndex];
    }

    TreeNode.prototype.getLeaves = function()
    {
        return this.leaves;
    }

    TreeNode.prototype.addLeaf = function(leaf)
    {
        this.leaves.push(leaf);
        this.currentLeafIndex++;
    }

    TreeNode.prototype.addLeafCurrentLeaf = function(leaf)
    {
        let currentLeaf = this.leaves[this.currentLeafIndex];
        if(currentLeaf)
        {
            currentLeaf.addLeaf(leaf);
        }
    }

    TreeNode.prototype.addLeafByData = function(data)
    {
        let leaf = new TreeNode(data);
        this.addLeaf(leaf);
    }

    TreeNode.prototype.setData = function(data)
    {
        this.data = data;
    }

    TreeNode.prototype.setCurrentLeafIndex = function(index)
    {
        this.currentLeafIndex = index;
    }

    // traverses the tree according to the current leaf indices
    // returns the data in an array, much like the old .convo field
    TreeNode.prototype.getCurrentData = function()
    {
        let data = [this.data];
        let currentLeaf = this.leaves[this.currentLeafIndex];
        let leafData = [];
        if(currentLeaf)
        {
            leafData = currentLeaf.getCurrentData();
        }
        return data.concat(leafData);
    }

    // return a primitive data version for storage
    TreeNode.prototype.toJSON = function()
    {
        let JSONObject = {data:this.data, leaves:[]};
        for(let index = 0, length = this.leaves.length; index < length; index++)
        {
            if(this.leaves[index])
            {
                JSONObject.leaves[index] = this.leaves[index].toJSON();
            }
            else
            {
                console.warn(`TreeNode.toJSON: Empty object at index ${index}.`);
            }
        }
        return JSONObject;
    }

    function encode_string_as_blob(string)
    {
        let bytes = new TextEncoder().encode(string);
        let blob = new Blob([bytes], {
            type: "application/json;charset=utf-8"
        });
        return blob;
    }
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

    function convert_chat_to_markdown(chat, title)
    {
        let string = "";
        if(title)
        {
            string += "# " + title + "\n";
        }
        else
        {
            string += "# " + "ChatGPT Conversation" + "\n";
        }
        string += "\n"; // two newlines because MD is like that
        let convo = chat;
        for(let i = 0; i < convo.length; i++)
        {
            let speaker = i % 2 === 0 ? "Human" : "Assistant";
            string += "**" + speaker + ":**\n";
            string += convo[i] + "\n";
            string += "\n";
            string += "***\n";
            string += "\n";
        }

        // timestamp
        let date = getDate();
        let time = getTime();

        string += "Exported on " + date + " " + time + ".";

        let blob = encode_string_as_blob(string);
        return blob;
    }

    function saveChildInnerHTML(parent, clone = true) { // generated by ChatGPT
        // Get the child elements of the parent
        let p1;
        if (clone) {
            p1 = parent.cloneNode(true)
            p1.setAttribute("style", "display: none;");
            history_box.innerHTML = "";
            history_box.appendChild(p1);
        } else {
            p1 = parent
        }
        var children = p1.children;

        // Create a string to store the innerHTML of each child
        var childInnerHTML = '';

        // Loop through each child element
        for (var i = 0; i < children.length; i++) {
            // Clone the child element
            var child = children[i];
            if (child.tagName == "PRE") {
                let div = child.firstChild.children[1]
                div.firstChild.classList.add('p-4')
                let text = div.innerHTML
                let clipboard = `<i class="fa-regular clipboard fa-clipboard"></i>`
                let copy_bar = `<div class="p-2 copy float-right">${clipboard} &nbsp; Copy code</div>`
                let template = `<pre>${copy_bar}<div>${text}</div></pre><br>`
                childInnerHTML += template;
            } else {
                // Remove the child's class attribute
                child.removeAttribute("class");

                // Recursively call the function on the child's children
                saveChildInnerHTML(child, false);

                // Add the child's innerHTML to the string
                childInnerHTML += child.outerHTML;
            }
        }

        return childInnerHTML;
    }

    function elementChildHasClass(element, className)
    {
        if(!element)
        {
            console.warn(`undefined element passed, returning undefined and doing nothing.`);
            return;
        }
        if(element.classList.contains(className)) return true;

        let children = element.children;
        for(let index = 0; index < children.length; index++)
        {
            if(elementChildHasClass(children[index], className)) return true;
        }
        return false;
    }

    function save_thread(human, h) {
        let text;
        if (human) {
            text = h.children[0].children[1].innerText // saves as plain text
            if(text.includes("Save & Submit\nCancel"))
            {
                // query the textarea instead
                text = h.querySelector("textarea")?.value;
            }
            text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        if (!human) {
            text = saveChildInnerHTML(h.firstChild.children[1].firstChild.firstChild.firstChild) // saves as html
            if (elementChildHasClass(h, 'text-red-500')){
                text = "ERROR"
            }
        }
        return text
    }

    function getDate() { // generated by ChatGPT
        var date = new Date();
        var options = {year: 'numeric', month: 'long', day: 'numeric'};
        return date.toLocaleString('default', options);
    }

    function getTime() { // generated by ChatGPT
        var currentDate = new Date();
        var options = {
            hour12: true,
            hour: "numeric",
            minute: "numeric"
        };
        var timeString = currentDate.toLocaleTimeString("default", options);
        return timeString
    }

    function generateUUID() {
        // create an array of possible characters for the UUID
        var possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        // create an empty string that will be used to generate the UUID
        var uuid = "";

        // loop over the possible characters and append a random character to the UUID string
        for (var i = 0; i < 36; i++) {
            uuid += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
        }

        // return the generated UUID
        return uuid;
    }

    /**
     Returns the data of the current chat text. Only saves one branch.
     This is intended for exports and or screenshots.
     Querys main again so it works with the new text.
     */
    function get_current_chat_text()
    {
        let mainElement = document.querySelector("main");
        // should be more robust, can't see how they would change the flex col anytime soon
        let chatContainer = mainElement.querySelector(".flex-col");
        // what is one part of a conversation called again? let's just call it a chat bubble
        let chatBubbleElements = chatContainer.children;;
        let chat = [];

        // remember to disregard the last element, which is always a filler element
        for(let i = 0; i < chatBubbleElements.length-1; i++)
        {
            let isHuman = (i % 2) === 0;
            let chatBubble = chatBubbleElements[i];
            let text = get_chat_bubble_text(chatBubble, isHuman);
            chat.push(text);
        }

        return chat;
    }

    // gets chat with errors, for current export.
    function get_chat_bubble_text(chatBubble, isHuman)
    {
        let text;
        if(isHuman)
        {
            text = chatBubble.innerText;
            if(text.includes("Save & Submit\nCancel"))
            {
                // query the textarea instead
                text = chatBubble.querySelector("textarea")?.value;
            }
            // for code
            text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        else
        {
            text = saveChildInnerHTML(chatBubble.firstChild.children[1].firstChild.firstChild.firstChild) // saves as html
        }
        return text;
    }

    function save_page() {
        c = p.children
        if (c.length > 2) {
            let t;
            browser.storage.local.get({threads: null}).then((result) => {
                t = result.threads
                page = [];
                let current_leaf = mirror_branch_state;
                for (let i = 0; i < c.length - 1; i++) {
                    let human = i % 2 === 0;
                    let child = c[i];
                    let text = save_thread(human, child)
                    if (text === "ERROR" || text.includes(`<p>network error</p>`) || text.includes(`<p>Load failed</p>`) || text.includes(`<p>Error in body stream/p>`)) {
                        text = t[t.length - 1].convo[i]
                        if (!text.endsWith(`(error)`)) {
                            text = `${text}<br> (error)`
                        }
                    }
                    page.push(text);

                    // mirror state;
					// get the children from the most specific div possible. It is always the LAST child of the profile pic container.
                    let elements = child.children[0].children[0].querySelectorAll("span");
                    // get last element because the first span in humans deals with profile pics
                    let spanText = elements[elements.length - 1]?.innerHTML; // html instead of text because it sometimes hides
                    if (human) {
                        // because there are now two spans being used for other stuff, but only for humans
                        if (elements.length < 3) spanText = undefined;
                    }

                    let leafIndex = 0;
					// remember that sometimes spanText is undefined, and that is normal because there isn't always a branch
                    if (spanText) {
                        let spanNumber = Number(spanText.split("/")[0]);
                        // sometimes spanText trawls up "!" that comes from content warning policy; just ignore that.
                        if (!isNaN(spanNumber)) {
                            // remember array indices start at 0
                            leafIndex = spanNumber - 1;
                            console.log(leafIndex);
                        }
                    }
                    current_leaf.setCurrentLeafIndex(leafIndex);
                    if (leafIndex > -1) {
                        let new_current_leaf = current_leaf.getCurrentLeaf();
                        if (!new_current_leaf) {
                            new_current_leaf = new TreeNode();
                            // array.set in case we don't start at the beginning.
                            // yes, that is a thing that happens
                            current_leaf.getLeaves()[leafIndex] = new_current_leaf;
                        }
                        new_current_leaf.setData(text);
                        current_leaf = new_current_leaf;
                    }
                }
                //console.log(mirror_branch_state.toJSON());
                if (mirror_branch_state.toJSON() !== null) {
                    let unified_id = false; // boolean to check if id matches ChatGPT ID
                    let conversation_id_el = document.querySelector('#conversationID');
                    if (conversation_id_el !== null) {
                        id = conversation_id_el.value;
                        unified_id = true;
                    }
                    else {
                        if (id === "") {
                            id = generateUUID();
                        }
                    }
                    if (t !== null) {
                        if (first_time) {
                            let thread = {
                                date: getDate(),
                                time: getTime(),
                                convo: page,
                                favorite: false,
                                id: id,
                                branch_state: mirror_branch_state.toJSON(),
                                unified_id: unified_id
                            }
                            t.push(thread)
                            first_time = false
                        }
                        else {
                            let thread = {
                                date: getDate(),
                                time: getTime(),
                                convo: page,
                                favorite: false,
                                id: id,
                                branch_state: mirror_branch_state.toJSON(),
                                unified_id: unified_id
                            }
                            t[t.length - 1] = thread
                        }
                        browser.storage.local.set({threads: t})
                    }
                    else {
                        let thread = {
                            date: getDate(),
                            time: getTime(),
                            convo: page,
                            favorite: false,
                            id: id,
                            branch_state: mirror_branch_state.toJSON()
                        }
                        let t = [thread]
                        first_time = false
                        browser.storage.local.set({threads: t})
                    }
                }
            });
        }
    }

    document.addEventListener('keydown', function (event) { // generated by ChatGPT
        // Check if the pressed key was the Enter key
        if (event.key === 'Enter') {
            setTimeout(save_page, 500)
        }
    });

    let main = p

    //let stop_saving;
    let interval;
    const observer = new MutationObserver(function () { // created by chatGPT
        if (!timer_started) {
            interval = setInterval(save_page, 2000);
        }
        timer_started = true;
    });
    observer.observe(main, { // created by ChatGPT
        subtree: true,
        childList: true,
    });

    let reset = document.querySelector("nav").firstChild
    reset.addEventListener('click', function () {
        first_time = true;
        mirror_branch_state = new TreeNode();
    })
    let timer_started = false

    function continue_convo(convo){
        const input = document.querySelector("textarea");
        input.style.height = "200px";
        const button = input.parentElement.querySelector("button");
        input.value = `${intro} ${convo}`;
        if (auto_send) {
            button.click();
        }
    }

    function use_prompt(prompt){
        const input = document.querySelector("textarea");
        input.style.height = "200px";
        const button = input.parentElement.querySelector("button");
        input.value = `${prompt}`;
        if (auto_send) {
            button.click();
        }
    }

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            console.log(request)
            if (request.type === "c_continue_convo") {
                console.log("message recieved!")
                continue_convo(JSON.stringify(request.convo))
            }
            else if(request.type === "c_use_prompt") {
                console.log("message recieved!");
                use_prompt(request.prompt);
            }
        }
    );
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(main, 500);
}
else {
    document.addEventListener("DOMContentLoaded", main);
}

let intro; let auto_send;
let defaults = {buttons: true, auto_send: false, auto_delete: false, message: "The following is a transcript of a conversation between me and ChatGPT. Use it for context in the rest of the conversation. Be ready to edit and build upon the responses previously given by ChatGPT. Respond \"ready!\" if you understand the context. Do not respond wit anything else. Conversation:\n"}
chrome.storage.local.get({settings: defaults}, function(result) {
    let settings = result.settings
    buttons = settings.buttons
    intro = settings.message
    auto_send = settings.auto_send
    console.log("buttons!" + buttons)
})