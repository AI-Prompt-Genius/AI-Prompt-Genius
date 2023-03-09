#!/bin/bash

# Set Git user name and email
git config --global user.email "aipromptgenius@gmail.com"
git config --global user.name "Ben Finch"

# Rest of the script
echo "new ad" > public/ads/testing.txt
git add public/ads/testing.txt
git commit -m "Update ad"
git push origin master
