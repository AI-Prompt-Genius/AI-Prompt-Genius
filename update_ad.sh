#!/bin/bash

# Set Git user name and email
git config --global user.email "${GIT_USER_EMAIL}"
git config --global user.name "${GIT_USER_NAME}"

# Rest of the script
echo "new ad 1" > public/ads/testing.txt
git add public/ads/testing.txt
git commit -m "Update ad"
git push origin ${{ github.ref }}
