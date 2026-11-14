# ========================================================
# ITCH.IO HTML5 BUILD & PACKAGING AUTOMATION
# ========================================================
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$projectDir = "c:\Users\Vaishnavi\maze"
$buildDir   = Join-Path $projectDir "itch-build"
$zipPath    = Join-Path $projectDir "my-game-itch.zip"

Write-Host "=================================================="
Write-Host "STEP 1: Validating Maze Levels..."
Write-Host "=================================================="
& powershell.exe -ExecutionPolicy Bypass -File (Join-Path $projectDir "verify_complete_game.ps1")
if ($LASTEXITCODE -ne 0) {
    throw "Level validation failed! Cannot package invalid maze levels."
}

Write-Host "`n=================================================="
Write-Host "STEP 2: Creating Clean itch-build Directory..."
Write-Host "=================================================="
if (Test-Path $buildDir) {
    Remove-Item -Path $buildDir -Recurse -Force
}
New-Item -Path $buildDir -ItemType Directory | Out-Null
New-Item -Path (Join-Path $buildDir "css") -ItemType Directory | Out-Null
New-Item -Path (Join-Path $buildDir "lib") -ItemType Directory | Out-Null
New-Item -Path (Join-Path $buildDir "js")  -ItemType Directory | Out-Null

Write-Host "Copying production files to itch-build..."
Copy-Item (Join-Path $projectDir "index.html") (Join-Path $buildDir "index.html") -Force
Copy-Item (Join-Path $projectDir "css\style.css") (Join-Path $buildDir "css\style.css") -Force
Copy-Item (Join-Path $projectDir "lib\three.min.js") (Join-Path $buildDir "lib\three.min.js") -Force

$jsFiles = @(
    "audio.js",
    "player.js",
    "maze.js",
    "hazards.js",
    "items.js",
    "shop.js",
    "game.js"
)

foreach ($jf in $jsFiles) {
    Copy-Item (Join-Path $projectDir "js\$jf") (Join-Path $buildDir "js\$jf") -Force
}

# Verify itch-build root
if (-not (Test-Path (Join-Path $buildDir "index.html"))) {
    throw "Verification error: index.html is missing from itch-build root!"
}

Write-Host "`n=================================================="
Write-Host "STEP 3: Packaging my-game-itch.zip with POSIX paths..."
Write-Host "=================================================="
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipStream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::Create)
$archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

$allBuildFiles = Get-ChildItem -Path $buildDir -Recurse -File
$sourceDirLen = $buildDir.TrimEnd('\').Length + 1

foreach ($file in $allBuildFiles) {
    $relativeName = $file.FullName.Substring($sourceDirLen) -replace '\\', '/'
    $entry = $archive.CreateEntry($relativeName, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    $fileStream = [System.IO.File]::OpenRead($file.FullName)
    $fileStream.CopyTo($entryStream)
    $fileStream.Dispose()
    $entryStream.Dispose()
    Write-Host "  Added to ZIP: $relativeName ($($file.Length) bytes)"
}

$archive.Dispose()
$zipStream.Dispose()

Write-Host "`n=================================================="
Write-Host "STEP 4: Verifying ZIP Structure & Integrity..."
Write-Host "=================================================="
$readStream = [System.IO.File]::OpenRead($zipPath)
$readArchive = New-Object System.IO.Compression.ZipArchive($readStream, [System.IO.Compression.ZipArchiveMode]::Read)

$zipEntries = @()
$hasRootIndex = $false
foreach ($ent in $readArchive.Entries) {
    $zipEntries += $ent.FullName
    if ($ent.FullName -eq "index.html") {
        $hasRootIndex = $true
    }
}

$readArchive.Dispose()
$readStream.Dispose()

Write-Host "Total entries in ZIP: $($zipEntries.Count)"
Write-Host "Entries found:"
$zipEntries | ForEach-Object { Write-Host " - $_" }

if (-not $hasRootIndex) {
    throw "ZIP Verification Failed: index.html was NOT found at the root of the ZIP file!"
}

$zipSize = (Get-Item $zipPath).Length
Write-Host "`nSUCCESS! my-game-itch.zip is ready."
Write-Host "ZIP Location: $zipPath"
Write-Host "ZIP Size: $([math]::Round($zipSize / 1KB, 1)) KB ($zipSize bytes)"
