<a href="https://chrome.google.com/webstore/detail/chatgpt-history/jjdnakkfjnnbbckhifcfchagnpofjffo/"><img src="https://user-images.githubusercontent.com/12115686/206926802-0461dc64-84cd-42de-8c17-74a7ee64528c.png" style="width: 180 !important; height: 50px !important"></a> <a href="https://addons.mozilla.org/en-US/firefox/addon/chatgpt-history/"><img src="https://user-images.githubusercontent.com/12115686/207746497-4b4ba50c-c579-42ad-b2e9-9164073499db.png" style="width: 180 !important; height: 50px !important"></a> <a href="https://www.buymeacoffee.com/bennyfi" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 48px !important;width: 173px !important;" ></a> <a href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img src="https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png" style="height: 48px !important"></a>


# ChatGPT History
<em>Written by ChatGPT, of course</em>

Welcome to ChatGPT History, a browser extension that allows you to save your ChatGPT conversation history. With this extension, you can easily review your past conversations and refer to them at a later time.

To use the extension, simply open ChatGPT and start chatting as you normally would. The extension will automatically save your conversation history in your browser. You can access your saved history by clicking on the extension icon in the top right corner of your browser.

In the extension's settings, you can choose to clear your saved history or export it as a text file for easy sharing or backup <em>(still need to implement)</em>.

We hope you find ChatGPT History useful and enjoy using it to save and review your ChatGPT conversations. If you have any feedback or suggestions for improvement, please don't hesitate to make a pull request. Thank you for using ChatGPT History!

Thread Explorer:
![screely-1670886428256](https://user-images.githubusercontent.com/12115686/207233691-92e31001-c045-4f77-bd3f-bc9170814360.png)



Thread View:
![screely-1670886518332](https://user-images.githubusercontent.com/12115686/207233426-e932fe34-0ffe-45c4-9f45-7a098e062f50.png)


## TODO
If you're looking to help out, you could add a few useful features to our platform:
- Known issue: reset thread button does not work after some time.
- Auto-delete (non-bookmarked) threads after 30 days
- Export individual threads to pdf, csv, txt, or doc formats
- Export all threads (done for JSON, but could add more formatted)
- Improvements to the styling on the "Thread Explorer" page
- Firefox support
- Gravatar (I guess)

These enhancements would make the platform even more user-friendly and useful for our users. Thank you for considering contributing to the project!

## Installation
- Chrome - Install from the <a href="https://chrome.google.com/webstore/detail/chatgpt-history/jjdnakkfjnnbbckhifcfchagnpofjffo/">Chrome Web Store</a>
- Firefox - Install from <a href="https://addons.mozilla.org/en-US/firefox/addon/chatgpt-history/">Fire Fox Add-ons library</a>
- Download zip code from <a href="https://github.com/benf2004/ChatGPT-History/releases">releases</a> and load "src" folder as a local extension. This would also allow you to make your own changes to it.

## Structure
<em>It's all vanilla, baby</em>

content.js - content script (saves ChatGPT threads to browser using browser.storage.local api)

background.js - sole purpose is to listen for when the user clicks the extension

Explorer.html - page that appears when clicking the extension icon <br>
---> Main JS: explorer.js; library - highlightJS.js <br>
---> Main CSS: explorer.css

Thread.html - page that appears when individual thread is loaded <br>
---> Main JS: thread.js <br>
---> Main CSS: thread.css

Shared JS: dark_light.js (handles dark/light mode)

Shared CSS: Navbar.css (same navbar)

## License
Shield: [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg
