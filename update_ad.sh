#!/bin/bash

# Set Git user name and email
git config --global user.email "aipromptgenius@gmail.com"
git config --global user.name "Ben Finch"

# Rest of the script
echo 'Sponsored by <u><a href="https://imgcreator.zmo.ai/?ref=chatgptpromptgenius" target="_blank">ZMO.AI</a></u> - The Ultimate Free Generator for AI Anime, Photo, and Design. Text to image, image to image & ChatGPT powered AI designer.' > public/ads/current.txt
echo 'https://imgcreator.zmo.ai/?ref=chatgptpromptgenius' > public/ads/currentUrl.txt
git add public/ads/current.txt
git add public/ads/currentUrl.txt
git commit -m "Update ad"
git push origin master
