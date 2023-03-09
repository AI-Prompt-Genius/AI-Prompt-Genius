#!/bin/bash

echo "testing a" > public/ads/testing.txt

git add public/ads/testing.txt
git commit -m "Update ad"
git push origin master
