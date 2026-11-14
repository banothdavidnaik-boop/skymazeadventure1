@echo off
title Deploying Sky Maze Adventure to GitHub...
color 0b
echo ========================================================
echo   Deploying Sky Maze Adventure to GitHub
echo   Repository: https://github.com/banothdavidnaik-boop/skymazeadventure1.git
echo ========================================================
echo.

set "PATH=C:\Users\Vaishnavi\mingit\cmd;%PATH%"
cd /d "c:\Users\Vaishnavi\maze"

echo [1/3] Staging and verifying repository files...
git add -A
git commit -m "Deploy Sky Maze Adventure: Complete HTML5 3D Maze Game with itch.io build" 2>nul
git branch -M main
git remote set-url origin https://github.com/banothdavidnaik-boop/skymazeadventure1.git 2>nul || git remote add origin https://github.com/banothdavidnaik-boop/skymazeadventure1.git

echo.
echo [2/3] Pushing code to GitHub...
echo (A browser sign-in window will open if this is your first time connecting.)
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! Game successfully deployed to GitHub!
    echo   https://github.com/banothdavidnaik-boop/skymazeadventure1
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   Push paused: GitHub authentication needed.
    echo ========================================================
)

echo.
pause
