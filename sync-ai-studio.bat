@echo off
setlocal

set "ZIP_FOLDER=C:\Users\User\Downloads\AIStudio-Zips"
set "PROJECT_FOLDER=C:\Users\User\Downloads\hello-test (1)"

echo ==============================
echo AI Studio -> GitHub Sync
echo ==============================

echo.
echo [1/4] Looking for latest ZIP...

for /f "delims=" %%F in ('dir /b /o-d "%ZIP_FOLDER%\*.zip" 2^>nul') do (
    set "LATEST_ZIP=%%F"
    goto FOUND_ZIP
)

echo No ZIP file found.
pause
exit /b 1

:FOUND_ZIP

echo Found:
echo %LATEST_ZIP%

echo.
echo [2/4] Extracting ZIP...

if exist "%TEMP%\aistudio-sync" rmdir /s /q "%TEMP%\aistudio-sync"

mkdir "%TEMP%\aistudio-sync"

powershell -NoProfile -Command "Expand-Archive -LiteralPath '%ZIP_FOLDER%\%LATEST_ZIP%' -DestinationPath '%TEMP%\aistudio-sync' -Force"

if errorlevel 1 (
    echo ZIP extraction failed.
    pause
    exit /b 1
)

echo.
echo [3/4] Syncing files...

robocopy "%TEMP%\aistudio-sync" "%PROJECT_FOLDER%" /E /XD ".git" "node_modules" ".idea"

echo.
echo [4/4] Git sync...

cd /d "%PROJECT_FOLDER%"

git status

git add .

git diff --cached --quiet

if %errorlevel%==0 (
    echo.
    echo No changes detected.
    pause
    exit /b 0
)

echo.
echo Changes detected.

git commit -m "Sync latest Google AI Studio project"

if errorlevel 1 (
    echo Commit failed.
    pause
    exit /b 1
)

git push origin main

if errorlevel 1 (
    echo Push failed.
    pause
    exit /b 1
)

echo.
echo ==============================
echo Sync completed successfully.
echo ==============================

pause