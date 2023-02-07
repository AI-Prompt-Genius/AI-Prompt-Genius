// the way that themes work is to inject it after everything else.
// inject theme
const THEMES_LIST = ["paper.css", "sms.css", "cozy-fireplace.css","landscape-cycles.css", "hacker.css","terminal.css","rain.css"];
// use the same names as you would in css, because that's where it's going 
const FONTS_LIST = ["Arial","Courier","Georgia","Times New Roman","Verdana"];
var currentTheme;
var currentFont;
var themeStylesheet;
var themeStyle;
var fontStyle;
var customStylesheet;
var customStyle;
var themeAudio;

function injectStylesheet(file)
{	
	let head = document.querySelector('head');
    let stylesheet = document.createElement('link');
    stylesheet.setAttribute('rel', 'stylesheet');
    stylesheet.setAttribute('type', 'text/css');
    stylesheet.setAttribute('href', file);
    head.appendChild(stylesheet);
	return stylesheet;
}

function injectStyle()
{
	let head = document.querySelector('head');
    let style = document.createElement('style');
    head.appendChild(style);
	return style;
}

function injectAudio()
{
	
}

function validTheme(theme){
	return THEMES_LIST.includes(theme.replace("themes/",""))
}

browser.storage.local.get({"theme":"none.css"}, function(result)
{
	currentTheme = result.theme;
	if (!validTheme(currentTheme)){
		currentTheme = "none.css"
	}
	changeTheme("themes/" + currentTheme, true);
	// reflect state in html; we must put this here because local storage loads later than DOM
	let options = themeSelectElement.querySelector("select")?.children;
	for(let index = 0; index < options?.length; index++)
	{
		let option = options[index];
		if(option.value === currentTheme)
		{
			option.setAttribute("selected","true");
		}
	}
});

// let users inject arbitrary CSS, what could go wrong?
// at least it's not JS so there probably aren't any exploits, and it's their own machine so they can do what they wish
browser.storage.local.get({"custom_style":""}, function(result)
{
	
});

function changeTheme(theme, onload=false)
{
	if (!validTheme(theme)){
		theme = "themes/none.css"
	}

	let css = browser.runtime.getURL(theme)
	// because dynamic paths, otherwise it won't work
	themeStylesheet.setAttribute('href', css);
	themeStyle.innerHTML = "";

	// reset and or stop audio
	if(themeAudio)
	{
		themeAudio.pause();
		themeAudio = null;
	}
	
	// special cases for dynaloading image paths
	function selectAudio(url){
		themeAudio = new Audio(url);
		themeAudio.load();
		themeAudio.loop = true;
		if (!onload){
			themeAudio.play()
		}
		else{ // this is due to a Chrome autoplay limitation. See: https://developer.chrome.com/blog/autoplay/
			document.body.addEventListener('keydown', () => setTimeout(() => themeAudio.play(), 500), {once: true})
		}
	}

	const host = "https://raw.githubusercontent.com/benf2004/ChatGPT-Prompt-Genius/master/public"
	if(theme === "themes/rain.css")
	{
		// load audio
		selectAudio(`${host}/sound/rain.mp3`);
	}
	else if (theme === `themes/cozy-fireplace.css`){
		selectAudio(`${host}/sound/fireplace.mp3`)
	}
}

/*
	Sets font by family name. 
	@param fontFamilyName the font name you'd use in css. use null if you want to remove the font.
 */
function setFont(fontFamilyName)
{
	if(fontFamilyName === null)
	{
		fontStyle.innerHTML = "";
	}
	else 
	{
	fontStyle.innerHTML = 
`
main {
	font-family: "${fontFamilyName}";
}
main .h-full.flex-col > div {
	font-family: "${fontFamilyName}";
}
`;
	}
}


// create theme selector
var themeSelectElement;
function createThemeSelectButton()
{
	let icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" style="fill: white" stroke="currentColor" ><path d="M512 256c0 .9 0 1.8 0 2.7c-.4 36.5-33.6 61.3-70.1 61.3H344c-26.5 0-48 21.5-48 48c0 3.4 .4 6.7 1 9.9c2.1 10.2 6.5 20 10.8 29.9c6.1 13.8 12.1 27.5 12.1 42c0 31.8-21.6 60.7-53.4 62c-3.5 .1-7 .2-10.6 .2C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256zM128 288c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm0-96c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32zM288 96c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm96 96c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32z"/></svg>`;
	
	let wrapper = document.createElement("a");
	wrapper.id = "theme-select-button";
	wrapper.setAttribute("class", 'flex px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm');
	wrapper.style.height = "44px";
	wrapper.innerHTML = `${icon}`;

	document.head.insertAdjacentHTML("beforeend", `<style>select:focus{--tw-ring-shadow: none!important}</style>`)
	
	let themeSelect = document.createElement("select");
	themeSelect.style.background = "transparent";
	themeSelect.style.height = "100%";
	themeSelect.style.width = "100%";
	themeSelect.style.paddingTop = "0.75rem";
	themeSelect.style.paddingBottom = "0.75rem";
	themeSelect.style.color = "inherit";
	themeSelect.style.marginLeft= "-3%"; //align the select
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
		currentTheme = themeFile;
		if (!validTheme(themeFile)){
			currentTheme = "themes/none.css"
		}
		// set default on select, and yes, invalid is a valid value.
		browser.storage.local.set({theme: currentTheme});
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
		
		if(themesList[index] === currentTheme) 
		{
			// default selected 
			themeOption.setAttribute("selected","true");
		}
	}
	
	wrapper.appendChild(themeSelect);
	
	var nav = document.querySelector("nav");
	nav.appendChild(wrapper);
	
	themeSelectElement = wrapper;
}

// create font selector
var fontSelectElement;
function createFontSelectButton()
{
	let icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="1em" height="1em" style="fill: white" stroke="currentColor"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M254 52.8C249.3 40.3 237.3 32 224 32s-25.3 8.3-30 20.8L57.8 416H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32h-1.8l18-48H303.8l18 48H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H390.2L254 52.8zM279.8 304H168.2L224 155.1 279.8 304z"/></svg>`;
	
	let wrapper = document.createElement("a");
	wrapper.id = "font-select-button";
	wrapper.setAttribute("class", 'flex px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm');
	wrapper.style.height = "44px";
	wrapper.innerHTML = `${icon}`;
	
	let fontSelect = document.createElement("select");
	fontSelect.style.background = "transparent";
	fontSelect.style.height = "100%";
	fontSelect.style.width = "100%";
	fontSelect.style.paddingTop = "0.75rem";
	fontSelect.style.paddingBottom = "0.75rem";
	fontSelect.style.color = "inherit";
	fontSelect.style.marginLeft= "-3%"; //align the select
	fontSelect.style.fontFamily = "inherit";
	fontSelect.style.fontSize = "inherit";
	fontSelect.style.overflow = "visible";
	fontSelect.style.border = "0";
	
	fontSelect.addEventListener("change", (event)=>
	{
		let fontFamily = fontSelect.value;
		
		if(fontFamily === "")
		{
			setFont(null);
		}
		else 
		{
			setFont(fontFamily);
		}
		
		currentFont = fontFamily;
	});
	
	let noFontOption = document.createElement("option");
	noFontOption.value = "";
	noFontOption.style.color = "black";
	noFontOption.innerHTML = "Default Font";
	fontSelect.appendChild(noFontOption);
	
	let fontsList = FONTS_LIST;
	for(index = 0; index < fontsList.length; index++)
	{
		let fontOption = document.createElement("option");
		fontOption.value = fontsList[index];
		fontOption.style.color = "black";
		fontOption.innerHTML = fontsList[index];
		fontSelect.appendChild(fontOption);
		
		if(fontsList[index] === currentFont) 
		{
			// default selected 
			fontOption.setAttribute("selected","true");
		}
	}
	
	wrapper.appendChild(fontSelect);
	
	var nav = document.querySelector("nav");
	nav.appendChild(wrapper);
	
	fontSelectElement = wrapper;
}

// create custom style button that click opens the editor box
var customStyleButton;
function createCustomStyleButton()
{
	
}

var customStyleEditor;
function createCustomStyleEditor()
{
	let container = document.createElement("div");
	container.setAttribute("class", "flex flex-col items-center h-full w-full");
	container.style.position = "fixed";
	container.style.top = 0;
	container.style.left = 0;
	container.style.justifyContent = "center";
	
	let editor = document.createElement("textarea");
	editor.setAttribute("cols","80");
	editor.setAttribute("rows","25");
	container.appendChild(editor);
	
	let saveChangesButton = document.createElement("button");
	saveChangesButton.innerHTML = "Apply Changes";
	saveChangesButton.setAttribute("class", "btn flex justify-center gap-2 btn-primary");
	saveChangesButton.style.marginTop = "1rem";
	container.appendChild(saveChangesButton);
	
	document.body.appendChild(container);
	
	customStyleEditor = container;
}

/*
	Re-add buttons hack.
 */
function readdThemeSelect()
{
	var nav = document.querySelector("nav");
	nav.appendChild(themeSelectElement);
	nav.appendChild(fontSelectElement);
}

// always place at the end because "let" statements can't be used before they're declared.
function initializeThemes()
{
	console.log(`Loading themes...`);
	themeStylesheet = injectStylesheet(browser.runtime.getURL('themes/none.css'));
	fontStyle = injectStyle();
	themeStyle = injectStyle();
	customStyle = injectStyle();

	createThemeSelectButton();
	createFontSelectButton();
	createCustomStyleEditor();
}
initializeThemes();