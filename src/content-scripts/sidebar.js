async function getPrompts() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get({'prompts': []}, function (data) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }
            else {
                resolve(data.prompts);
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
    const prompts = await getPrompts()
    const translations = await getTranslations()
    console.log(await translations)
    const t = await translations
    const promptBar = // styles from chatbotui.com (MIT - Mckay Wrigley)
        `
<div id="prompt-bar" class="flex h-full flex-1 flex-col space-y-1 p-2" style="position:fixed; z-index: 1; right:0; width:260px; background-color: #202123">
  <div class="flex items-center">
    <button style="width: 190px;"class="flex text-white text-sm flex-shrink-0 items-center gap-3 rounded-md border hover:bg-gray-500/10 border-white/20 p-3 text-white">
      ${svg("plus")} ${tr("new_prompt", t)}</button>
    <button class="flex items-center flex-shrink-0 gap-3 p-3 ml-2 text-sm text-white transition-colors duration-200 border rounded-md cursor-pointer border-white/20 hover:bg-gray-500/10">
      ${svg("folder")}
    </button>
  </div>
  <div class="relative flex items-center">
    <input class="w-full flex-1 rounded-md border border-neutral-600 px-4 py-3 pr-10 text-[14px] leading-3 text-white" type="text" placeholder='${tr("search_prompts", t)}' value="" style="background-color: #202123">
  </div>
  <div class="flex-grow overflow-auto">
    <div class="pt-2">
      <div class="flex w-full flex-col gap-1" id="sidebarPrompts">
        <!--begin prompt column template-->
        ${prompts.map((prompt) => `
            <div class="relative flex items-center">
                <button class="pgbtn flex w-full text-white cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-500/10" draggable="true">
                    ${svg("lightbulb")}
                    <div style="font-size: 12.5px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 165px" class="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all pr-4 text-left text-[12.5px] leading-3">${prompt.title}</div>
                </button>
                <div class="absolute right-1 z-10 flex text-gray-300">
                    <button style="min-width: 20px" class="p-1 text-neutral-400 svg-hover">
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
    const nav = (document.querySelector("nav")).parentElement.parentElement.parentElement
    const mainPar = document.querySelector("main").parentElement
    const closeNavButton = `<button id="closeNav" style="position: absolute; z-index: 1; bottom: 0; left: 259px; background-color: #202123; width: 28px; height: 28px; color: white; border-top-right-radius: 5px; border-bottom-right-radius: 3px;"><</button>`
    nav.insertAdjacentHTML("afterend", promptBar)
    nav.insertAdjacentHTML("afterend", closeNavButton)
    mainPar.style.marginRight = "220px"

    function addStyles(){

        const styles = `<style>.pgbtn:hover{background-color: rgba(52,53,65,.9)};.svg-hover:hover{color: #F5F5F5!important;}</style>`
        document.head.insertAdjacentHTML("beforeend", styles)
    }
    addStyles()

    function toggleNav() {
        const hidden = nav.style.display === "none"
        const closeNavBut = document.getElementById("closeNav")
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

    function togglePrompt() {
        const myNav = document.getElementById("prompt-bar")
        const hidden = myNav.style.display === "none"
        const closePrompt = document.getElementById("closePrompt")
        if (hidden) {
            myNav.style.display = "block"
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

    function svg(name){
        switch(name){
            case "lightbulb" : return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-bulb-filled"><path d="M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" fill="currentColor" stroke-width="0"></path><path d="M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z" fill="currentColor" stroke-width="0"></path><path d="M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" fill="currentColor" stroke-width="0"></path><path d="M4.893 4.893a1 1 0 0 1 1.32 -.083l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 0 -1.414z" fill="currentColor" stroke-width="0"></path><path d="M17.693 4.893a1 1 0 0 1 1.497 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7z" fill="currentColor" stroke-width="0"></path><path d="M14 18a1 1 0 0 1 1 1a3 3 0 0 1 -6 0a1 1 0 0 1 .883 -.993l.117 -.007h4z" fill="currentColor" stroke-width="0"></path><path d="M12 6a6 6 0 0 1 3.6 10.8a1 1 0 0 1 -.471 .192l-.129 .008h-6a1 1 0 0 1 -.6 -.2a6 6 0 0 1 3.6 -10.8z" fill="currentColor" stroke-width="0"></path></svg>`
            case "folder" : return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-folder-plus"> <path d="M12 19h-7a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v3.5"></path> <path d="M16 19h6"></path> <path d="M19 16v6"></path> </svg>`;
            case "trash" : return  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-trash"> <path d="M4 7l16 0"></path> <path d="M10 11l0 6"></path> <path d="M14 11l0 6"></path> <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path> <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path> </svg>`
            case "plus" : return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-plus"> <path d="M12 5l0 14"></path> <path d="M5 12l14 0"></path> </svg>`
        }
    }

    document.getElementById("closeNav").addEventListener("click", toggleNav)
    document.getElementById("closePrompt").addEventListener("click", togglePrompt)
}
setTimeout(main, 1000)