$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = 'Stop'

$url = 'https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/MinGit-2.47.1-64-bit.zip'
$zipDest = 'C:\Users\Vaishnavi\mingit.zip'
$extractDest = 'C:\Users\Vaishnavi\mingit'

Write-Host "Downloading MinGit..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $url -OutFile $zipDest -UseBasicParsing
Write-Host "Downloaded: $((Get-Item $zipDest).Length) bytes"

if (Test-Path $extractDest) {
    Remove-Item $extractDest -Recurse -Force
}
New-Item -Path $extractDest -ItemType Directory | Out-Null

Write-Host "Extracting MinGit to $extractDest..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipDest, $extractDest)

$gitExe = Join-Path $extractDest "cmd\git.exe"
if (Test-Path $gitExe) {
    Write-Host "MinGit successfully installed at: $gitExe"
    & $gitExe --version
} else {
    throw "git.exe not found at $gitExe"
}

Remove-Item $zipDest -Force
