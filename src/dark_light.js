let icon = document.querySelector('.sun-moon')
function switchClass(element) {
    if (element.classList.contains("dark")) {
        element.classList.remove("dark");
        element.classList.add("light");
        document.querySelector("#d_l").innerHTML = "Dark"
        icon.classList.remove('fa-sun-bright')
        icon.classList.add('fa-moon')
        chrome.storage.sync.set({mode: "light"})
    }
    else if (element.classList.contains("light")) {
        element.classList.remove("light");
        element.classList.add("dark");
        document.querySelector("#d_l").innerHTML = "Light"
        icon.classList.remove('fa-moon')
        icon.classList.add('fa-sun-bright')
        chrome.storage.sync.set({mode: "dark"})
    }

    // Recursively call the function for all children of the element
    for (const child of element.children) {
        switchClass(child);
    }
}
function switch_mode(){
    switchClass(document.body)
}

chrome.storage.sync.get({mode: "dark"}, function(result) {
    if(result.mode === "light"){
        switch_mode()
    }
})

document.getElementById('light_dark').addEventListener('click', switch_mode)

window.addEventListener("load", (event) => {
    document.getElementById('cover').style.display = 'none';
});