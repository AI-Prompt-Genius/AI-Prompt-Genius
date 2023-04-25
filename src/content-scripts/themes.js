// the way that themes work is to inject it after everything else.
// inject theme
const THEMES_LIST = ["paper.css", "sms.css", "cozy-fireplace.css","landscape-cycles.css", "hacker.css","terminal.css","rain.css", "JustBigger.css"];
// use the same names as you would in css, because that's where it's going 
const FONTS_LIST = ["Arial","Courier","Georgia","Times New Roman","Verdana"];
const SVG_ICONS = {
	palette:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" style="fill: white" stroke="currentColor" ><path d="M512 256c0 .9 0 1.8 0 2.7c-.4 36.5-33.6 61.3-70.1 61.3H344c-26.5 0-48 21.5-48 48c0 3.4 .4 6.7 1 9.9c2.1 10.2 6.5 20 10.8 29.9c6.1 13.8 12.1 27.5 12.1 42c0 31.8-21.6 60.7-53.4 62c-3.5 .1-7 .2-10.6 .2C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256zM128 288c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm0-96c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32zM288 96c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm96 96c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32z"/></svg>`,
	font:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="1em" height="1em" style="fill: white" stroke="currentColor"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M254 52.8C249.3 40.3 237.3 32 224 32s-25.3 8.3-30 20.8L57.8 416H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32h-1.8l18-48H303.8l18 48H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H390.2L254 52.8zM279.8 304H168.2L224 155.1 279.8 304z"/></svg>`,
	code:`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-braces" viewBox="0 0 16 16" width="1em" height="1em" style="fill: white" stroke="currentColor"><path d="M2.114 8.063V7.9c1.005-.102 1.497-.615 1.497-1.6V4.503c0-1.094.39-1.538 1.354-1.538h.273V2h-.376C3.25 2 2.49 2.759 2.49 4.352v1.524c0 1.094-.376 1.456-1.49 1.456v1.299c1.114 0 1.49.362 1.49 1.456v1.524c0 1.593.759 2.352 2.372 2.352h.376v-.964h-.273c-.964 0-1.354-.444-1.354-1.538V9.663c0-.984-.492-1.497-1.497-1.6zM13.886 7.9v.163c-1.005.103-1.497.616-1.497 1.6v1.798c0 1.094-.39 1.538-1.354 1.538h-.273v.964h.376c1.613 0 2.372-.759 2.372-2.352v-1.524c0-1.094.376-1.456 1.49-1.456V7.332c-1.114 0-1.49-.362-1.49-1.456V4.352C13.51 2.759 12.75 2 11.138 2h-.376v.964h.273c.964 0 1.354.444 1.354 1.538V6.3c0 .984.492 1.497 1.497 1.6z"/></svg>`,
};
var currentTheme;
var currentFont;
var themeStylesheet;
var themeStyle;
var fontStyle;
var customStylesheet;
var customStyle;
var themeAudio;
let menuThemeEditorButton = null;

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
	if (!theme){
		return false
	}
	return THEMES_LIST.includes(theme.replace("themes/",""))
}

function validFont(font){
	return FONTS_LIST.includes(font);
}

function changeTheme(theme, onload=false)
{
	if (!validTheme(theme)){
		theme = "themes/none.css"
	}

	let css = chrome.runtime.getURL(theme)
	// because dynamic paths, otherwise it won't work
	if (themeStylesheet){
		themeStylesheet.setAttribute('href', css);
		themeStyle.innerHTML = "";
	}

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

function changeThemeSetting(settingName, settingValue)
{
	chrome.storage.local.get({"theme":{}}, (result) =>
	{
		let themeSettings = result.theme;
		if(typeof themeSettings === "string") themeSettings = {"theme": themeSettings};
		
		themeSettings[settingName] = settingValue;
		
		chrome.storage.local.set({theme: themeSettings});
	});
}

// create theme selector
var themeSelectElement;
function createThemeSelectButton()
{
	let icon = SVG_ICONS.palette;
	
	let wrapper = document.createElement("a");
	wrapper.id = "theme-select-button";
	wrapper.setAttribute("class", 'flex px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm');
	wrapper.style.height = "44px";
	wrapper.style.width = "244px";
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
		//console.log(`${themeFile} selected!`);
		
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
			currentTheme = "none.css"
		}
		// set default on select, and yes, invalid is a valid value.
		changeThemeSetting("theme",currentTheme);
	});
	
	let noThemeOption = document.createElement("option");
	let noTheme = tr("no_theme");
	noThemeOption.value = "";
	noThemeOption.style.color = "black";
	noThemeOption.innerHTML = `${noTheme}`;
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
	themeSelectElement = wrapper;
	return wrapper;
}

// create font selector
var fontSelectElement;
function createFontSelectButton()
{
	let icon = SVG_ICONS.font;
	
	let wrapper = document.createElement("a");
	wrapper.id = "font-select-button";
	wrapper.setAttribute("class", 'flex px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm');
	wrapper.style.height = "44px";
	wrapper.style.width = "244px";
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
		changeThemeSetting("font", fontFamily);
	});
	
	let noFontOption = document.createElement("option");
	let noFont = tr("no_font");
	noFontOption.value = "";
	noFontOption.style.color = "black";
	noFontOption.innerHTML = `${noFont}`;
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
	fontSelectElement = wrapper;
}

// create custom style button that click opens the editor box
var customStyleButton;
function createCustomStyleButton()
{
	let icon = SVG_ICONS.code;
	
	let wrapper = createButton(icon, "Advanced Style");
	wrapper.addEventListener("click", ()=>
	{
		customStyleEditor.style.visibility = "visible";
		chrome.storage.local.get({"theme":{}}, (result) =>
		{
			let themeSettings = result.theme;
			let customCSS = themeSettings?.customCSS;
			
			if(customCSS === undefined) customCSS = "";
			
			customStyleEditor.querySelector("textarea").value = customCSS;
		});
	});
	
	customStyleButton = wrapper;
}

// let users inject arbitrary CSS, what could go wrong?
// at least it's not JS so there probably aren't any exploits, and it's their own machine so they can do what they wish
var customStyleEditor;
function createCustomStyleEditor()
{
	let wrapper = document.createElement("div");;
	wrapper.setAttribute("class", "flex flex-col items-center h-full w-full");
	wrapper.style.background = "rgba(25,25,25,0.7)";
	wrapper.style.position = "fixed";
	wrapper.style.top = 0;
	wrapper.style.left = 0;
	wrapper.style.justifyContent = "center";
	wrapper.style.visibility = "hidden"; // default to hidden for the modal
	
	let container = document.createElement("div");
	container.setAttribute("class", "flex flex-col items-center bg-gray-50 dark:bg-gray-800");
	container.style.borderRadius = "1rem";
	container.style.padding = "1rem";
	wrapper.appendChild(container);
	
	let editorTitle = document.createElement("h1");
	editorTitle.innerHTML = "Advanced Style Editor";
	container.appendChild(editorTitle);
	
	let editorInfo = document.createElement("p");
	editorInfo.innerHTML = `Add some custom CSS which will be injected after everything else. For example, try changing the background color using`;
	container.appendChild(editorInfo);
	
	let editorCodeExample = document.createElement("code");
	editorCodeExample.innerHTML = `<code>main .h-full.flex-col > div
{
    background-color: red;
}</code>`;
	editorCodeExample.style.width = `100%`;
	editorCodeExample.style.whiteSpace = `break-spaces`;
	container.appendChild(editorCodeExample);
	
	let editor = document.createElement("textarea");
	editor.setAttribute("class", "mt-2 dark:bg-gray-800");
	editor.setAttribute("cols","80");
	editor.setAttribute("rows","25");
	container.appendChild(editor);
	
	let buttonsContainer = document.createElement("div");
	buttonsContainer.setAttribute("class", "text-center mt-2 flex justify-center");
	container.appendChild(buttonsContainer);
	
	let saveChangesButton = document.createElement("button");
	saveChangesButton.innerHTML = "Apply Changes";
	saveChangesButton.setAttribute("class", "btn flex justify-center gap-2 btn-primary mr-2");
	buttonsContainer.appendChild(saveChangesButton);
	
	saveChangesButton.addEventListener("click", function()
	{
		customStyle.innerHTML = editor.value;
		changeThemeSetting("customCSS",editor.value);
	});
	
	let cancelButton = document.createElement("button");
	cancelButton.innerHTML = "Cancel";
	cancelButton.setAttribute("class", "btn flex justify-center gap-2 btn-neutral");
	buttonsContainer.appendChild(cancelButton);
	
	cancelButton.addEventListener("click", function()
	{
		customStyleEditor.style.visibility = "hidden";
	});
	
	customStyleEditor = wrapper;
}

/*
	Create menu theme editor that opens to the right.
 */
function createMenuThemeEditorButton()
{
	let icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" style="fill: white" stroke="currentColor" ><path d="M512 256c0 .9 0 1.8 0 2.7c-.4 36.5-33.6 61.3-70.1 61.3H344c-26.5 0-48 21.5-48 48c0 3.4 .4 6.7 1 9.9c2.1 10.2 6.5 20 10.8 29.9c6.1 13.8 12.1 27.5 12.1 42c0 31.8-21.6 60.7-53.4 62c-3.5 .1-7 .2-10.6 .2C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256zM128 288c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm0-96c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32zM288 96c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm96 96c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32z"/></svg>`;
	
	let wrapper = document.createElement("div");
	wrapper.id = "menu-theme-editor-button";
	// wrapper.setAttribute("class", 'flex px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm');
	wrapper.style.height = "44px";
	wrapper.style.padding = "0";
	// wrapper.style.position = "relative";
	
	let button = document.createElement("a");
	button.setAttribute("class", 'flex px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm');
	button.style.width = "100%";
	button.style.height = "100%";
	let translated = tr("theme_settings")
	//console.log(typeof translated)
	button.innerHTML = `${icon} ${translated}`;
	wrapper.appendChild(button);
	menuThemeEditorButton = wrapper;
	button.addEventListener("click", toggleMenuThemeEditor);
	createMenuThemeEditor();
}

var menuThemeEditorElement;
function createMenuThemeEditor()
{
	//console.log("Creating menu theme editor")
	let wrapper = document.createElement("div");
	wrapper.setAttribute("class", 'flex flex-col items-center bg-gray-900 text-white space-y-1 p-2');
	wrapper.style.width = "260px"; // same width as the left menu bar
	wrapper.style.position = "absolute"; 
	wrapper.style.left = "260px";
	wrapper.style.zIndex = "3"
	wrapper.style.bottom = "0";
	
	let titleContainer = document.createElement("div");
	titleContainer.setAttribute("class", 'border-b border-white/20 w-full px-3');
	titleContainer.style.height = "44px"; // same height as buttons
	wrapper.appendChild(titleContainer);
	
	let title = document.createElement("h1");
	title.innerHTML = `${tr("theme_settings")}`;
	// title.style.padding = "12px";
	title.style.fontSize = "1em";
	title.style.fontWeight = "normal";
	title.style.textAlign = "center";
	titleContainer.appendChild(title);
	
	menuThemeEditorButton.appendChild(wrapper);
	
	menuThemeEditorElement = wrapper;
	
	// append buttons 
	menuThemeEditorElement.appendChild(themeSelectElement);
	menuThemeEditorElement.appendChild(fontSelectElement);
	//menuThemeEditorElement.appendChild(customStyleButton);
	
	closeMenuThemeEditor();
}

function openMenuThemeEditor()
{
	menuThemeEditorElement.style.visibility = "visible";
}

function closeMenuThemeEditor()
{
	menuThemeEditorElement.style.visibility = "hidden";
}

function toggleMenuThemeEditor()
{
	console.warn("toggling")
	//console.log(menuThemeEditorElement)
	if(menuThemeEditorElement.style.visibility === "visible")
	{
		closeMenuThemeEditor();
	}
	else 
	{
		openMenuThemeEditor();
	}
}

/**
	Button boilerplate.
	Does not do an onclick.
 */
function createButton(iconHTML, buttonText)
{
	let button = document.createElement("a");
	button.setAttribute("class", 'flex px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm');
	button.style.height = "44px";
	button.style.width = "244px";
	
	button.innerHTML = `${iconHTML} ${buttonText}`;
	
	return button;
}

/*
	Re-add buttons hack.
 */
function readdThemeSelect()
{
	var nav = document.querySelector("nav");
	if (menuThemeEditorButton) {
		nav.appendChild(menuThemeEditorButton);
	}
}
readdThemeSelect()

// always place at the end because "let" statements can't be used before they're declared.
function initializeThemes() {
	//console.log(`Loading themes...`);
	themeStylesheet = injectStylesheet(chrome.runtime.getURL('themes/none.css'));
	fontStyle = injectStyle();
	themeStyle = injectStyle();
	customStyle = injectStyle();

	createCustomStyleEditor();
	document.body.appendChild(customStyleEditor);

	createThemeSelectButton();
	createFontSelectButton();
	createCustomStyleButton();
	createMenuThemeEditorButton();

	readdThemeSelect();

	chrome.storage.local.get({"theme":{}}, function(result)  {
		let themeSettings = result.theme;
		//console.log(themeSettings);
		if(typeof themeSettings === "string") themeSettings = {"theme": themeSettings};

		currentTheme = themeSettings?.theme;
		if (!validTheme(currentTheme)){
			currentTheme = "none.css"
		}
		changeTheme("themes/" + currentTheme, true);
		// reflect state in html; we must put this here because local storage loads later than DOM
		var options = themeSelectElement.querySelector("select")?.children;
		for(let index = 0; index < options?.length; index++)
		{
			let option = options[index];
			if (option.value === currentTheme) {
				option.setAttribute("selected","true");
			}
		}

		currentFont = themeSettings?.font;
		//console.log(currentFont);
		if (!validFont(currentFont)) {
			currentFont = null;
		}
		setFont(currentFont);
		var options = fontSelectElement.querySelector("select")?.children;
		for(let index = 0; index < options?.length; index++)
		{
			let option = options[index];
			if(option.value === currentFont)
			{
				option.setAttribute("selected","true");
			}
		}

		let customCSS = themeSettings?.customCSS;
		customStyle.innerHTML = customCSS;
	});
}
