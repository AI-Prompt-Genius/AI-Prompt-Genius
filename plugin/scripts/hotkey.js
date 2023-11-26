async function main() {
    const prompts = await chrome.storage.local.get({ currentPrompts: [] })
    document.head.insertAdjacentHTML("beforeend", styles())
    document.body.insertAdjacentHTML("beforeend", modal(prompts))
    addEvents()
}
const existing_modal = document.getElementById("modal-pg")
if (!existing_modal) main()

function addEvents(){
    // Event listener for the search box
    const searchBox = document.getElementById("searchInput");
    searchBox.addEventListener("input", filterPrompts);

    // Event listeners for each prompt item to copy text on click
    const prompts = document.getElementById("promptsContainer").getElementsByClassName("prompt-item");
    Array.from(prompts).forEach(prompt => {
        prompt.addEventListener("click", function() {
            copyToClipboard(this.getAttribute('data-text'));
        });
    });
}


function modal(prompts) {
    // Generates HTML for each prompt without inline event handlers
    let promptItems = prompts.currentPrompts.map((prompt, index) => `
        <div class="prompt-item" data-text="${prompt.text}" id="prompt-${index}">
            <div class="prompt-title">${prompt.title}</div>
        </div>
    `).join('');

    return `
        <div id="modal-pg" class="modal-pg">
            <div class="modal-content-pg">
                <input type="text" id="searchInput" placeholder="Search prompts..." class="search-input">
                <div id="promptsContainer" class="prompts-container">
                    ${promptItems}
                </div>
            </div>
        </div>
    `;
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
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}
.modal-content-pg {
    background-color: #fefefe;
    margin: 10% auto; /* 10% from the top and centered */
    padding: 20px;
    border: 1px solid #888;
    width: 80%; /* Could be more or less, depending on screen size */
    border-radius: 10px;
}
.search-input {
    width: 100%;
    padding: 10px;
    margin-bottom: 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
}
.prompt-item {
    padding: 10px;
    border-bottom: 1px solid #ddd;
    cursor: pointer;
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
</style>
    `
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Text copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function filterPrompts() {
    let input = document.getElementById('searchInput');
    let filter = input.value.toLowerCase();
    let promptsContainer = document.getElementById('promptsContainer');
    let prompts = promptsContainer.getElementsByClassName('prompt-item');
    for (let i = 0; i < prompts.length; i++) {
        let title = prompts[i].getElementsByClassName('prompt-title')[0];
        if (title.innerText.toLowerCase().indexOf(filter) > -1) {
            prompts[i].style.display = "";
        } else {
            prompts[i].style.display = "none";
        }
    }
}