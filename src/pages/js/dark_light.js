let icon = document.querySelector('.sun-moon')
async function switchClass(element) {
    if (element.classList.contains("dark")) {
        element.classList.remove("dark");
        element.classList.add("light");
        document.querySelector("#d_l").innerHTML = await translate("dark")
        icon.classList.remove('fa-sun-bright')
        icon.classList.add('fa-moon')
        chrome.storage.local.set({mode: "light"})
    }
    else if (element.classList.contains("light")) {
        element.classList.remove("light");
        element.classList.add("dark");
        document.querySelector("#d_l").innerHTML = await translate("light")
        icon.classList.remove('fa-moon')
        icon.classList.add('fa-sun-bright')
        chrome.storage.local.set({mode: "dark"})
    }

    // Recursively call the function for all children of the element
    for (const child of element.children) {
        switchClass(child);
    }
}
function toggleMode(){
    switchClass(document.body)
}

chrome.storage.local.get({mode: "dark"}, function(result) {
    if(result.mode === "light"){
        toggleMode()
    }
})
document.getElementById('light_dark').addEventListener('click', toggleMode)
window.addEventListener("load", (event) => {
    document.getElementById('cover').style.display = 'none';
});