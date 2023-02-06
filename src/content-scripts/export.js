if (typeof browser === "undefined") {
    browser = chrome
}

function exportMain() {
    let buttons;
    browser.storage.local.get({settings: defaults}, function (result) {
        let settings = result.settings
        buttons = true; // temp for testing
		// I have no idea why, but if this is put after add_buttons it just... doesn't go.
		
        if (buttons === true) {
            if (!document.getElementById('download-markdown-button')) {
                add_buttons();
            }
        }
    })
}

// TODO, move this somewhere more central
let current_url = window.location.href;
function check_url() {
    if (current_url !== window.location.href) {
        current_url = window.location.href;
		// use postMessage to communicate with injected scripts
		window.postMessage(
			{
				type: "urlChange"
			}, "*");
		readdThemeSelect(); // just going to yoink this in here, from themes.js, as this is more convenient.
        console.log("URL CHANGE")
    }
}
setInterval(check_url, 500);