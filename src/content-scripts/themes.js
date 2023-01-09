console.log(`Loading themes...`);

// the way that themes work is to inject it after everything else.
// remember to expose themes in web_accessible_resources
// inject theme 
const THEMES_LIST = ["cozy-fireplace.css","hacker.css","sms.css"];
var themeStylesheet;

function injectStyle(file)
{	
	let head = document.querySelector('head');
    let stylesheet = document.createElement('link');
	themeStylesheet = stylesheet;
    stylesheet.setAttribute('rel', 'stylesheet');
    stylesheet.setAttribute('type', 'text/css');
    stylesheet.setAttribute('href', file);
    head.appendChild(stylesheet);
}

injectStyle(browser.runtime.getURL('themes/none.css'));

function changeTheme(theme)
{
	// because dynamic paths, otherwise it won't work
	themeStylesheet.setAttribute('href', browser.runtime.getURL(theme));
}

// theme selector
let themeSelectElement;
function addThemeSelectButton()
{
	let icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" style="fill: white" stroke="currentColor" ><path d="M512 256c0 .9 0 1.8 0 2.7c-.4 36.5-33.6 61.3-70.1 61.3H344c-26.5 0-48 21.5-48 48c0 3.4 .4 6.7 1 9.9c2.1 10.2 6.5 20 10.8 29.9c6.1 13.8 12.1 27.5 12.1 42c0 31.8-21.6 60.7-53.4 62c-3.5 .1-7 .2-10.6 .2C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256zM128 288c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm0-96c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32zM288 96c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm96 96c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32z"/></svg>`;
	
	let wrapper = document.createElement("a");
	wrapper.id = "theme-select-button";
	wrapper.setAttribute("class", 'flex px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm');
	wrapper.innerHTML = `${icon}`;

	document.head.insertAdjacentHTML("beforeend", `<style>select:focus{--tw-ring-shadow: none!important}</style>`)
	
	let themeSelect = document.createElement("select");
	themeSelect.style.background = "transparent";
	themeSelect.style.height = "100%";
	themeSelect.style.width = "100%";
	themeSelect.style.paddingTop = "0.75rem";
	themeSelect.style.paddingBottom = "0.75rem";
	themeSelect.style.color = "inherit";
	themeSelect.style.fontFamily = "inherit";
	themeSelect.style.fontSize = "inherit";
	themeSelect.style.overflow = "visible";
	themeSelect.style.border = "0";
	
	themeSelect.addEventListener("change", (event)=>
	{
		let themeFile = themeSelect.value;
		console.log(`${themeFile} selected!`);
		
		if(themeFile === "")
		{
			changeTheme("themes/none.css");
		}
		else 
		{
			changeTheme("themes/" + themeFile);
		}
	});
	
	let noThemeOption = document.createElement("option");
	noThemeOption.value = "";
	noThemeOption.style.color = "black";
	noThemeOption.innerHTML = "No Theme";
	themeSelect.appendChild(noThemeOption);
	
	let themesList = THEMES_LIST;
	for(index = 0; index < themesList.length; index++)
	{
		let themeOption = document.createElement("option");
		themeOption.value = themesList[index];
		themeOption.style.color = "black";
		themeOption.innerHTML = themesList[index];
		themeSelect.appendChild(themeOption);
		/*
		if(themesList[index] === "cozy-fireplace.css") 
		{
			// default selected 
			themeOption.setAttribute("selected","true");
		}
		*/
	}
	
	wrapper.appendChild(themeSelect);
	
	var nav = document.querySelector("nav");
	nav.appendChild(wrapper);
	
	themeSelectElement = wrapper;
}

addThemeSelectButton();

/*
	Re-add buttons hack.
 */
function readdThemeSelect()
{
	var nav = document.querySelector("nav");
	nav.appendChild(themeSelectElement);
}