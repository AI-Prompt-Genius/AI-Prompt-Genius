#!/bin/bash

# Set Git user name and email
git config --global user.email "aipromptgenius@gmail.com"
git config --global user.name "Ben Finch"

# Rest of the script
echo 'Sponsored by <u><a href="https://www.jaybird.ai/?utm_source=prompt-genius&utm_medium=banner&utm_campaign=march-2023" target="_blank">Jaybird.ai</a></u> - AI writing assistant designed specifically for developers.' > public/ads/current.txt
git add public/ads/current.txt
git commit -m "Update ad"
git push origin master
