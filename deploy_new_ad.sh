#!/bin/bash

echo "testing ad schedule" > public/ads/testing.txt

git add public/ads/testing.txt
git commit -m "Update ad"
git push origin master
