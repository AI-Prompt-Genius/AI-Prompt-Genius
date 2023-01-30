// we use an IIFE so as to not pollute the global namespace in the page 
// unlike other scripts, this will be injected, and so namespace pollution does matter
const ExportButtons = (function()
{
	if (typeof browser === "undefined") {
		browser = chrome
	}
	
	return {
		addDropDownStyle: function()
		{
			let style = document.createElement("style");
			style.innerHTML = `
				/* Dropdown Content (Hidden by Default) */
				.dropdown-content {
				  display: none;
				  border: 1px solid #f1f1f1;
				  border-radius: 10px;
				  z-index: 1;
				}
				
				#shareExport {
				   border: none !important;
				}
				  
				/* Show the dropdown menu (use JS to add this class to the .dropdown-content container when the user clicks on the dropdown button) */
				.show {display:block;} !important`;
			document.head.appendChild(style);
		},
		
		createDropDown: function()
		{
			 let button_class = 'flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm';
			 let shareSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" style="fill: white" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M246.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 109.3V320c0 17.7 14.3 32 32 32s32-14.3 32-32V109.3l73.4 73.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-128-128zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64c0 53 43 96 96 96H352c53 0 96-43 96-96V352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V352z"/></svg>`;
			 
		},
	}
})();