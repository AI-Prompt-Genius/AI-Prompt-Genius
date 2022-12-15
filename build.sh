#!/bin/bash

# First, create the dist directories if they don't already exist
mkdir -p dist_mv3 dist_mv2 releases

# Copy the files from "src" to "dist_mv3" and "dist_mv2"
cp -r src/* dist_mv3
cp -r src/* dist_mv2

# Copy the manifest files to their respective dist directories
cp manifests/mv3-manifest/manifest.json dist_mv3
cp manifests/mv2-manifest/manifest.json dist_mv2

# Zip the dist directories
zip -rj releases/dist_mv3.zip dist_mv3
zip -rj releases/dist_mv2.zip dist_mv2