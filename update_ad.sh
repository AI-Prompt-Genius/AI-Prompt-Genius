#!/bin/bash

# Set Git user name and email
git config --global user.email "aipromptgenius@gmail.com"
git config --global user.name "Ben Finch"

# Rest of the script
echo 'Sponsored by <u><a href="https://www.usechatgpt.ai/install?ref=chatgptpromptgenius" target="_blank">UseChatGPT.AI</a></u> - Free ChatGPT Copilot on Chrome (GPT-4 ✓). Use ChatGPT on any website without copy-pasting.' > public/ads/current.txt
echo 'https://www.usechatgpt.ai/install?ref=chatgptpromptgenius' > public/ads/currentUrl.txt
git add public/ads/current.txt
git add public/ads/currentUrl.txt
git commit -m "Update ad"
git push origin master
