#!/bin/bash

# Remove the dist directories if they already exist
rm -rf dist_mv3 dist_mv2

# Create the dist directories
mkdir -p dist_mv3 dist_mv2

# Copy the files from "plugin" to "dist_mv3" and "dist_mv2"
cp -r plugin/* dist_mv3
cp -r plugin/* dist_mv2

# Copy the manifest files to their respective dist directories
cp manifests/mv3-manifest/manifest.json dist_mv3
cp manifests/mv2-manifest/manifest.json dist_mv2

zip -r -FS dist_mv3.zip dist_mv3

cd dist_mv2
zip -r -FS ../dist_mv2.zip *
cd ..

mv dist_mv3.zip ~/Downloads
mv dist_mv2.zip ~/Downloads