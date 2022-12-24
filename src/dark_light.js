if (typeof browser === "undefined") {
    browser = chrome
    firefox = false
}
else{
    firefox = true
}
let icon = document.querySelector('.sun-moon')
function switchClass(element) {
    console.log(element.classList.contains('dark'))
    console.log(element)
    if (element.classList.contains("dark")) {
        element.classList.remove("dark");
        element.classList.add("light");
        document.querySelector("#d_l").innerHTML = "Dark"
        icon.classList.remove('fa-sun-bright')
        icon.classList.add('fa-moon')
        browser.storage.local.set({mode: "light"})
    }
    else if (element.classList.contains("light")) {
        element.classList.remove("light");
        element.classList.add("dark");
        document.querySelector("#d_l").innerHTML = "Light"
        icon.classList.remove('fa-moon')
        icon.classList.add('fa-sun-bright')
        browser.storage.local.set({mode: "dark"})
    }

    // Recursively call the function for all children of the element
    for (const child of element.children) {
        switchClass(child);
    }
}
function toggleMode(){
    switchClass(document.body)
}

browser.storage.local.get({mode: "dark"}, function(result) {
    console.log(result.mode)
    if(result.mode === "light"){
        console.log("TRUE!")
        toggleMode()
    }
})
document.getElementById('light_dark').addEventListener('click', toggleMode)
window.addEventListener("load", (event) => {
    document.getElementById('cover').style.display = 'none';
});