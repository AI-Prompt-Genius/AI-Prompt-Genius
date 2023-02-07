if (typeof browser === "undefined") {
    browser = chrome
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
		setTimeout(readdThemeSelect, 500);
        console.log("URL CHANGE")
    }
}
setInterval(check_url, 500);