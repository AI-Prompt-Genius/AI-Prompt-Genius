if (typeof browser === "undefined") {
    browser = chrome
    firefox = false
}
else{
    firefox = true
}
let icon = document.querySelector('.sun-moon')
function switchClass(element, isDark) {
    if (!isDark && element.classList.contains("dark")) {
        element.classList.remove("dark");
        element.classList.add("light");
        document.querySelector("#d_l").innerHTML = "Dark"
        icon.classList.remove('fa-sun-bright')
        icon.classList.add('fa-moon')
    }
    else if (isDark && element.classList.contains("light")) {
        element.classList.remove("light");
        element.classList.add("dark");
        document.querySelector("#d_l").innerHTML = "Light"
        icon.classList.remove('fa-moon')
        icon.classList.add('fa-sun-bright')
    }

    // Recursively call the function for all children of the element
    for (const child of element.children) {
        switchClass(child, isDark);
    }
}

function switch_mode(isDark){
    switchClass(document.body, isDark); 
}

function toggle_mode(){
	browser.storage.local.get({mode: "dark"}, function(result) {
		if(result && result.mode === "light"){
			browser.storage.local.set({mode: "dark"});
			switch_mode(true);
		}
		else 
		{
			browser.storage.local.set({mode: "light"});
			switch_mode(false);
		}
	});
}



browser.storage.local.get({mode: "dark"}, function(result) {
    if(result && result.mode === "light"){
        switch_mode(true);
    }
})

document.getElementById('light_dark').addEventListener('click', toggle_mode)

window.addEventListener("load", (event) => {
    document.getElementById('cover').style.display = 'none';
});