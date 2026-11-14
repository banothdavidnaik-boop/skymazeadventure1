$ErrorActionPreference = 'Continue'
$git = "C:\Users\Vaishnavi\mingit\cmd\git.exe"
$repoDir = "c:\Users\Vaishnavi\maze"

Set-Location $repoDir
Write-Host "Attempting git push to origin main..."
& $git push -u origin main 2>&1
Write-Host "Exit code: $LASTEXITCODE"
