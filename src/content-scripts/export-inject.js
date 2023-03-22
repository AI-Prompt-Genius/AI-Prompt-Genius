/* utilities - always inject, translate */
injectScript(chrome.runtime.getURL('content-scripts/utility.js'), 'body');
function addExportButtons()
{
	let buttonsFlag;
	chrome.storage.local.get({settings: {}}, function (result) {
		chrome.storage.local.get({lang: "en"}, function (result){
			console.log("inserting!")
			lang = result.lang ?? "en"
			let url = chrome.runtime.getURL(`_locales/${lang}/messages.json`)
			fetch(url)
				.then((response) => response.json())
				.then((translations) => {
					myMessages = translations
					messages = JSON.stringify(translations)
					document.body.appendChild(document.createElement(`input`)).setAttribute("id", "pr-messages")
					document.querySelector("#pr-messages").setAttribute("type", "hidden")
					document.querySelector("#pr-messages").value = messages
					let settings = result.settings;
					buttonsFlag = settings?.buttons ?? true;
					if (buttonsFlag === true) {

						// we inject script to try to defeat CORS not allowing us to save images

						/* libraries */
						injectScript(chrome.runtime.getURL('external-js/html2canvas.js'), 'body');
						injectScript(chrome.runtime.getURL('external-js/jspdf.umd.js'), 'body');
						/* main script*/
						injectScript(chrome.runtime.getURL('content-scripts/export-buttons.js'), 'body');
						injectScript(chrome.runtime.getURL('content-scripts/translate-inject.js'), 'body');
					}
					readdThemeSelect(); // just going to yoink this in here, from themes.js, as this is more convenient.
					initializeThemes();
				})
		})
    });
}
addExportButtons();

let myMessages; let lang;
function tr(key, translations=myMessages) {
	if (translations[key]) {
		return translations[key].message;
	}
}