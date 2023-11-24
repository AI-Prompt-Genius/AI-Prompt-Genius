#!/bin/bash

# Define the directory
DIRECTORY="plugin"

# Check if the directory exists
if [ -d "$DIRECTORY" ]; then
    # Use find to iterate over .html, .js, .json, and .txt files in the directory
    # and sed to replace the text in each file
    find "$DIRECTORY" \( -name "*.html" -o -name "*.js" -o -name "*.json" -o -name "*.txt" \) -type f -exec sed -i '' 's|http://localhost:5173|https://lib.aipromptgenius.com|g' {} +
else
    echo "Directory $DIRECTORY does not exist."
fi
