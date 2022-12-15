REM Batch script for windows systems.
@echo off

REM First, create the dist directories if they don't already exist
mkdir "dist_mv3" "dist_mv2"

REM Copy the files from "src" to "dist_mv3" and "dist_mv2"
ROBOCOPY  "src" "dist_mv3"
ROBOCOPY  "src" "dist_mv2"

REM Copy the manifest files to their respective dist directories
ROBOCOPY  "manifests\mv3-manifest\manifest.json" "dist_mv3"
ROBOCOPY  "manifests\mv2-manifest\manifest.json" "dist_mv2"