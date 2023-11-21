const tabs = document.querySelectorAll(".feature-tabs")
const img = document.getElementById("featureImg")
const selTab = "group relative rounded-full px-4 py-1 lg:rounded-l-xl lg:rounded-r-none lg:p-6 lg:ring-1 lg:ring-inset lg:ring-white/10 lg:hover:bg-white/5 bg-white lg:bg-white/10".split(" ")
const unSelTab = "group relative rounded-full px-4 py-1 lg:rounded-l-xl lg:rounded-r-none lg:p-6 hover:bg-white/10 lg:hover:bg-white/5".split(" ")
const selBut = "feature-tabs font-display text-lg [&:not(:focus-visible)]:focus:outline-none text-blue-600 lg:text-white selected".split(" ")
const unSelBut = "feature-tabs font-display text-lg [&:not(:focus-visible)]:focus:outline-none text-blue-100 hover:text-white lg:text-white".split(" ")
for (const tab of tabs){
    tab.addEventListener("click", () => focusTab(tab))
}
function focusTab(tab){
    for (const but of tabs){
        but.classList.remove(...selBut)
        but.classList.add(...unSelBut)
    }
    tab.classList.remove(...unSelTab)
    tab.classList.add(...selBut)
    for (let tab of tabs){
        tab = tab.parentElement.parentElement
        tab.classList.remove(...selTab)
        tab.classList.add(...unSelTab)
    }
    const selectedTab = tab.parentElement.parentElement
    selectedTab.classList.remove(...unSelTab)
    selectedTab.classList.add(...selTab)
    if (tab.id === "hotkey"){
        img.src = "images/hotkey.gif"
        document.getElementById("description").innerText = "Easily access the best prompts for ChatGPT with just a few clicks. Our extension offers easy access with the help of hotkeys."
    }
    else if (tab.id === "theme"){
        img.src = "images/themedemo.gif"
        document.getElementById("description").innerText = "Customize your ChatGPT with themes like hacker, SMS or cozy fireplace. Choose the theme that suits your style best."
    }
    else if (tab.id === "export"){
        img.src = "images/export.gif"
        document.getElementById("description").innerText = "Export your chats to markdown, HTML, PDF or PNG as per your convenience. Auto-save your ChatGPT history offline for easy searching."
    }
}