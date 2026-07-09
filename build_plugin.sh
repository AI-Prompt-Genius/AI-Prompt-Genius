#!/bin/bash
set -euo pipefail

# Builds two extension zips from the single plugin/ source folder:
#   - Chrome:  uses plugin/manifest.json as-is
#   - Firefox: swaps plugin/firefox-manifest.json in as manifest.json
#
# The only per-browser difference is the manifest; background.js and the page
# scripts feature-detect the rest at runtime.

# Directory to be zipped
PLUGIN_DIR=plugin

# Destination directory
DEST_DIR=~/Downloads

# Pull the version out of the Chrome manifest so both zips stay in sync with it.
VERSION=$(grep '"version"' "$PLUGIN_DIR/manifest.json" | head -1 | sed -E 's/.*"version"[^"]*"([^"]+)".*/\1/')
VERSION_TAG=${VERSION//./_}

CHROME_ZIP="AI_Prompt-Genius_chrome_v${VERSION_TAG}.zip"
FIREFOX_ZIP="AI_Prompt-Genius_firefox_v${VERSION_TAG}.zip"

# Never ship the Firefox-only manifest inside the Chrome package (or an old zip).
EXCLUDES=(-x "$PLUGIN_DIR/firefox-manifest.json" -x "*/.DS_Store")

# --- Chrome build -----------------------------------------------------------
rm -f "$CHROME_ZIP"
zip -r "$CHROME_ZIP" "$PLUGIN_DIR" "${EXCLUDES[@]}"

# --- Firefox build ----------------------------------------------------------
# Zip the folder, then replace manifest.json inside the archive with the
# Firefox one (renamed on the fly via a temp copy) so plugin/ is left untouched.
rm -f "$FIREFOX_ZIP"
TMP_DIR=$(mktemp -d)
cp -R "$PLUGIN_DIR" "$TMP_DIR/$PLUGIN_DIR"
mv "$TMP_DIR/$PLUGIN_DIR/firefox-manifest.json" "$TMP_DIR/$PLUGIN_DIR/manifest.json"
(cd "$TMP_DIR" && zip -r "$OLDPWD/$FIREFOX_ZIP" "$PLUGIN_DIR" -x "*/.DS_Store")
rm -rf "$TMP_DIR"

# --- Publish ----------------------------------------------------------------
mv -f "$CHROME_ZIP" "$FIREFOX_ZIP" "$DEST_DIR"

echo "Built:"
echo "  $DEST_DIR/$CHROME_ZIP"
echo "  $DEST_DIR/$FIREFOX_ZIP"
