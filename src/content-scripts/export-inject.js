function addExportButtons()
{
	let buttonsFlag;
	chrome.storage.local.get({settings: defaults}, function (result) {
        let settings = result.settings;
        buttonsFlag = settings.buttons ?? true;
        if (buttonsFlag === true) {
			
			// we inject script to try to defeat CORS not allowing us to save images
			
			/* libraries */
			injectScript(chrome.runtime.getURL('external-js/html2canvas.js'), 'body');
			injectScript(chrome.runtime.getURL('external-js/jspdf.umd.js'), 'body');
			/* utilities */
			injectScript(chrome.runtime.getURL('content-scripts/utility.js'), 'body');
			/* main script*/
			injectScript(chrome.runtime.getURL('content-scripts/export-buttons.js'), 'body');
        }
		readdThemeSelect(); // just going to yoink this in here, from themes.js, as this is more convenient.
    });

}
addExportButtons();
