@echo off
title Deploying Sky Maze Adventure to GitHub...
echo ========================================================
echo  Deploying Sky Maze Adventure to GitHub
echo  Repository: https://github.com/banothdavidnaik-boop/skymazeadventure1.git
echo ========================================================
echo.

set "PATH=C:\Users\Vaishnavi\mingit\cmd;%PATH%"
cd /d "c:\Users\Vaishnavi\maze"

echo [1/4] Staging game files and itch build...
git add -A

echo [2/4] Committing changes...
git commit -m "Deploy Sky Maze Adventure: Complete HTML5 3D Maze Game with itch.io build" 2>nul

echo [3/4] Renaming branch to main...
git branch -M main

echo [4/4] Configuring remote...
git remote set-url origin https://github.com/banothdavidnaik-boop/skymazeadventure1.git 2>nul || git remote add origin https://github.com/banothdavidnaik-boop/skymazeadventure1.git

echo.
echo Pushing to GitHub (if a browser window opens, please sign in or click Authorize)...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! Code deployed to GitHub!
    echo  https://github.com/banothdavidnaik-boop/skymazeadventure1
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  Push failed with error code %ERRORLEVEL%.
    echo  If needed, provide a GitHub Personal Access Token (PAT).
    echo ========================================================
)

echo.
pause
