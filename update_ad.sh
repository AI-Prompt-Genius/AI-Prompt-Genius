#!/bin/bash

# Set Git user name and email
git config --global user.email "aipromptgenius@gmail.com"
git config --global user.name "benf2004"

# Rest of the script
echo 'Sponsored by <u><a href="https://link.aipromptgenius.app/useai" target="_blank">UseChatGPT.AI</a></u> - Free ChatGPT Copilot on Chrome. Use ChatGPT (GPT-4 ✓) on any website without copy-pasting.' > public/ads/current.txt
echo 'https://link.aipromptgenius.app/useai-uninstall' > public/ads/currentUrl.txt
git add public/ads/current.txt
git add public/ads/currentUrl.txt
git commit -m "Update ad"
git push origin master
