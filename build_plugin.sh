#!/bin/bash

# Directory to be zipped
PLUGIN_DIR=plugin

# Destination directory
DEST_DIR=~/Downloads

# Name of the zip file
ZIP_FILE=AI_Prompt-Genius_v4_3_3.zip

# Zip the directory
zip -r "$ZIP_FILE" $(basename "$PLUGIN_DIR")

# Move the zip file to the destination directory
mv "$ZIP_FILE" "$DEST_DIR"
