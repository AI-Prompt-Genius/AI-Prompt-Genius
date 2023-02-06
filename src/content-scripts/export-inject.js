if (typeof browser === "undefined"){
    browser = chrome;
}

function addExportButtons()
{
	let buttonsFlag;
	browser.storage.local.get({settings: defaults}, function (result) {
        let settings = result.settings;
        buttonsFlag = settings.buttons;
		
		// TODO temp override until default init is fixed 
		buttonsFlag = true;
		
        if (buttonsFlag === true) {
			
			// we inject script to try to defeat CORS not allowing us to save images
			
			/* libraries */
			injectScript(browser.runtime.getURL('external-js/html2canvas.js'), 'body');
			injectScript(browser.runtime.getURL('external-js/jspdf.umd.js'), 'body');
			/* utilities */
			injectScript(browser.runtime.getURL('content-scripts/utility.js'), 'body');
			/* main script*/
			injectScript(browser.runtime.getURL('content-scripts/export-buttons.js'), 'body');
        }
		readdThemeSelect(); // just going to yoink this in here, from themes.js, as this is more convenient.
    });
}
addExportButtons();
