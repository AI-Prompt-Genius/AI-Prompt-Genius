#!/bin/bash

# Set Git user name and email
git config --global user.email "aipromptgenius@gmail.com"
git config --global user.name "Ben Finch"

# Rest of the script
echo 'Sponsored by <u><a href="https://7yq2.short.gy/CDKWGF" target="_blank">Bing Chat History</a></u>. Save your Bing chats to your browser. For free. <em><a href="https://7yq2.short.gy/OwDoLv" target="_blank"> <u>Advertise here.</u></a></em>' > public/ads/current.txt
echo 'https://7yq2.short.gy/CDKWGF' > public/ads/currentUrl.txt
git add public/ads/current.txt
git add public/ads/currentUrl.txt
git commit -m "Update ad"
git push origin master
