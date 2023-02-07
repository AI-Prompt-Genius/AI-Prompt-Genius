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