console.log(`Loading themes...`);

// the way that themes work is to inject it after everything else.
// remember to expose themes in web_accessible_resources
// inject theme 
function injectStyle(file)
{	
	let head = document.querySelector('head');
    let stylesheet = document.createElement('link');
    stylesheet.setAttribute('rel', 'stylesheet');
    stylesheet.setAttribute('type', 'text/css');
    stylesheet.setAttribute('href', file);
    head.appendChild(stylesheet);
}

injectStyle(browser.runtime.getURL('themes/cozy-fireplace.css'));

	
