#!/bin/bash

# Set Git user name and email
git config --global user.email "aipromptgenius@gmail.com"
git config --global user.name "Ben Finch"

# Rest of the script
echo 'Sponsored by <u><a href="https://aipromptpal.com/?ref=chatgptpromptgenius" target="_blank">aiPromptPal</a></u> - enhance ChatGPT by adding customizable right-click prompts, Gmail integration, and supplement search results.' > public/ads/current.txt
echo 'https://aipromptpal.com/?ref=chatgptpromptgenius' > public/ads/currentUrl.txt
git add public/ads/current.txt
git add public/ads/currentUrl.txt
git commit -m "Update ad"
git push origin master
