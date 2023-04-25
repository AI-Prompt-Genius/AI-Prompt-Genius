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
        //console.log("URL CHANGE");
    }
	
	// throw in other checks for convenience's sake. I know it's probably bad practice 
	// but I'm too lazy to write a main() right now
	
	// basically, constantly vigils and readds the menu buttons if they disappear for whatever reason
	if (!document.getElementById('download-markdown-button')) {
		window.postMessage(
			{
				type: "readdExportButtons"
			}, "*");
	}
	if (!document.getElementById('menu-theme-editor-button')) {
		readdThemeSelect();
	}
	
}
setInterval(check_url, 500);