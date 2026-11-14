# Verify extraction of my-game-itch.zip
$ErrorActionPreference = 'Stop'
$testExtractDir = "c:\Users\Vaishnavi\maze\test_extract"
$zipPath = "c:\Users\Vaishnavi\maze\my-game-itch.zip"

if (Test-Path $testExtractDir) {
    Remove-Item $testExtractDir -Recurse -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $testExtractDir)

$extractedFiles = Get-ChildItem -Path $testExtractDir -Recurse -File
Write-Host "Extracted $($extractedFiles.Count) files successfully from ZIP."

$indexFile = Join-Path $testExtractDir "index.html"
if (Test-Path $indexFile) {
    Write-Host "PASS: index.html is directly at the root of extracted ZIP!"
} else {
    throw "FAIL: index.html was NOT found at root!"
}

# Clean up test extraction directory
Remove-Item $testExtractDir -Recurse -Force
Write-Host "ZIP verification complete: 100% valid archive."
