<a href="https://chrome.google.com/webstore/detail/chatgpt-history/jjdnakkfjnnbbckhifcfchagnpofjffo/"><img src="https://user-images.githubusercontent.com/12115686/206926802-0461dc64-84cd-42de-8c17-74a7ee64528c.png" style="width: 180px !important; height: 50px !important"></a> <a href="https://addons.mozilla.org/en-US/firefox/addon/chatgpt-history/"><img src="https://user-images.githubusercontent.com/12115686/207746497-4b4ba50c-c579-42ad-b2e9-9164073499db.png" style="width: 180 !important; height: 50px !important"></a> <a href="https://www.reddit.com/r/ChatGPTPromptGenius/"><img src="https://user-images.githubusercontent.com/12115686/211184170-6aea6981-abd4-447c-bd3d-199d1688011f.png" style="width: 50px !important"></a> <a href="https://www.buymeacoffee.com/bennyfi" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 48px !important;width: 173px !important;" ></a> <a href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img src="https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png" style="height: 48px !important"></a>

<a href="https://chrome.google.com/webstore/detail/chatgpt-history/jjdnakkfjnnbbckhifcfchagnpofjffo/"><img alt="Chrome Web Store" src="https://img.shields.io/chrome-web-store/users/jjdnakkfjnnbbckhifcfchagnpofjffo?color=red&label=Chrome%20Users"></a>
<a href="https://addons.mozilla.org/en-US/firefox/addon/chatgpt-history/"><img alt="Mozilla Add-on" src="https://img.shields.io/amo/users/chatgpt-history?label=Firefox%20Users"></a> ![Chrome Web Store](https://img.shields.io/chrome-web-store/stars/jjdnakkfjnnbbckhifcfchagnpofjffo?color=yellow)

[Advertise with us](https://github.com/benf2004/ChatGPT-Prompt-Genius/blob/master/ADVERTISING.md)

# ChatGPT Prompt Genius 
<em>Written by ChatGPT, of course</em>

🎉 Welcome to ChatGPT Prompt Genius, a free, open-source browser extension that helps you 🔍 discover, share, import, and use the best prompts for ChatGPT. You can also 💾 save your chat history locally so you can easily review past conversations and refer to them at a later time.

You can use the extension's prompt templates feature to easily find and add prompts to your collection. You can search, categorize, and select prompts right on the page, making it easy to find creative and productive ways to use ChatGPT.

🎨Add themes like SMS, cozy fireplace, and hacker on the ChatGPT page.

To use the history saving feature, simply open ChatGPT and start chatting 💬 as you normally would. The extension will automatically save your conversation history in your browser. You can access your saved history by clicking on the extension icon 🔍 in the top right corner of your browser. The extension rerenders your conversation in a style that closely matches ChatGPT, including code rendering & copying.

On the explore page, you can 🔖 bookmark threads or 🔍 search through your threads & prompt templates. You can also save the your chats as html/pdf/png 📄 right on ChatGPT.

We hope you find ChatGPT Prompt Genius useful and enjoy using it to find and save your ChatGPT prompts. If you have any feedback or suggestions for improvement, please don't hesitate to fill out the feedback form. Thank you for using ChatGPT Prompt Genius!

Prompt Creator:

<img width="640" alt="Screen Shot 2023-01-07 at 11 34 16 PM" src="https://user-images.githubusercontent.com/12115686/211184017-57b816d8-020b-4cbf-a67b-579b142068f3.png">

Curated Prompt View:

<img width="640" alt="Screen Shot 2023-01-07 at 11 35 09 PM" src="https://user-images.githubusercontent.com/12115686/211184023-777ff59d-a20d-4510-a7ae-30d9d86682ba.png">

SMS Theme:

<img width="640" alt="SMS" src="https://user-images.githubusercontent.com/12115686/211184025-b515a3e8-33f3-4e4a-aae8-ec1a30af0a50.png">


Thread Explorer:
![screely-1670886428256](https://user-images.githubusercontent.com/12115686/207233691-92e31001-c045-4f77-bd3f-bc9170814360.png)



Thread View:
![screely-1670886518332](https://user-images.githubusercontent.com/12115686/207233426-e932fe34-0ffe-45c4-9f45-7a098e062f50.png)


## TODO
Please see TODO.md and the issues tab. These enhancements would make the platform even more user-friendly and useful for our users. Thank you for considering contributing to the project!

## Installation
- Chrome - Install from the <a href="https://chrome.google.com/webstore/detail/chatgpt-history/jjdnakkfjnnbbckhifcfchagnpofjffo/">Chrome Web Store</a>
- Firefox - Install from <a href="https://addons.mozilla.org/en-US/firefox/addon/chatgpt-history/">Fire Fox Add-ons library</a>
- Run locally - clone the repo and run the appropriate build script for your OS. Use mv2 for Firefox and mv3 for Chrome.

## Structure
<em>It's all vanilla, baby</em>
src/content-scripts: includes all content scripts (including history scraper, prompt injection, export buttons, and reddit stuff)
src/external-js: external libraries 
src/icons: extension icons
src/pages: includes all the extension pages (HTML + CSS + JS) for viewing thread history & prompt templates
src/themes: CSS themes for styling ChatGPT
background.js: listens for user clicks and handles message passing
utility.js: common JS

CSS: Bootstrap & Font Awesome Icons + some ustom



## Credit 
- Thanks to @liady for the libaries used for the export functions. See <a href="https://github.com/liady/ChatGPT-pdf">ChatGPT-pdf</a> for more.
- Thanks to <a href="https://github.com/mohalobaidi/EnhancedChatGPT">Enhanced ChatGPT's</a> code for in-page prompt insertion.
- Many thanks to @aivct for contributing many new features.

## License
Shield: [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg

Proper Attribution (include in prominent file):

```
/* ChatGPT Prompt Genius - https://github.com/benf2004/ChatGPT-Prompt-Genius
@benf2004 - https://github.com/benf2004/ - Creator
@aivct - https://github.com/aivct/ - Major Contributor
@itsmohmans - https://github.com/itsmohmans - Contributor
@Abhishek7Tech - https://github.com/Abhishek7Tech - Contributor
[list of files/directories with code]
*/
```

