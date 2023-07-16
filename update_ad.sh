#!/bin/bash

# Set Git user name and email
git config --global user.email "code@phooey.foo"
git config --global user.name "benf2004"

# Rest of the script
echo 'Consider leaving <u><a href="https://chrome.google.com/webstore/detail/ai-prompt-genius/jjdnakkfjnnbbckhifcfchagnpofjffo" target="_blank">a review</a></u> or <u><a href="ko-fi.com/bennyfi">a tip</a></u>. Seeking new advertisers - <u><a href="https://link.aipromptgenius.app/ads-jul16" target="_blank">learn more.</a></u>' > public/ads/current.txt
echo 'https://link.aipromptgenius.app/useai-uninstall' > public/ads/currentUrl.txt
git add public/ads/current.txt
git add public/ads/currentUrl.txt
git commit -m "Update ad"
git push origin master
