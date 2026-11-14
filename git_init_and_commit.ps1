$ErrorActionPreference = 'Continue'
$git = "C:\Users\Vaishnavi\mingit\cmd\git.exe"
$repoDir = "c:\Users\Vaishnavi\maze"

Set-Location $repoDir

if (-not (Test-Path "$repoDir\.git")) {
    Write-Host "Initializing git repository..."
    & $git init
}

Write-Host "Configuring remote..."
$remotes = & $git remote
if ($remotes -contains "origin") {
    & $git remote set-url origin "https://github.com/banothdavidnaik-boop/skymazeadventure1.git"
} else {
    & $git remote add origin "https://github.com/banothdavidnaik-boop/skymazeadventure1.git"
}

Write-Host "Staging files..."
& $git add -A

Write-Host "Current git status:"
& $git status --short

$status = & $git status --porcelain
if ($status) {
    Write-Host "Committing changes..."
    & $git commit -m "Deploy Sky Maze Adventure: Complete HTML5 3D Maze Game with itch.io build"
} else {
    Write-Host "No changes to commit."
}

& $git branch -M main

Write-Host "Local repository ready on branch 'main'."
& $git log -1 --oneline
