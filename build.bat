REM Batch script for windows systems.
@echo off

:: Remove the dist directories if they already exist
if exist dist_mv3 rmdir /s /q dist_mv3
if exist dist_mv2 rmdir /s /q dist_mv2

:: Create the dist directories
mkdir dist_mv3
mkdir dist_mv2

:: Copy the files from "src" to "dist_mv3" and "dist_mv2"
xcopy /s /e src\* dist_mv3
xcopy /s /e src\* dist_mv2

:: Copy the manifest files to their respective dist directories
copy manifests\mv3-manifest\manifest.json dist_mv3
copy manifests\mv2-manifest\manifest.json dist_mv2

REM
pause