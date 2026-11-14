Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$dest = "c:\Users\Vaishnavi\maze\site_deploy.zip"
if (Test-Path $dest) { Remove-Item $dest -Force }

$tempFolder = "c:\Users\Vaishnavi\maze\temp_deploy"
if (Test-Path $tempFolder) { Remove-Item $tempFolder -Recurse -Force }

New-Item -ItemType Directory -Path "$tempFolder" | Out-Null
New-Item -ItemType Directory -Path "$tempFolder\css" | Out-Null
New-Item -ItemType Directory -Path "$tempFolder\js" | Out-Null
New-Item -ItemType Directory -Path "$tempFolder\lib" | Out-Null

Copy-Item "c:\Users\Vaishnavi\maze\index.html" "$tempFolder\"
Copy-Item "c:\Users\Vaishnavi\maze\css\style.css" "$tempFolder\css\"
Copy-Item "c:\Users\Vaishnavi\maze\lib\three.min.js" "$tempFolder\lib\"
Copy-Item "c:\Users\Vaishnavi\maze\js\*.js" "$tempFolder\js\"

$mode = [System.IO.Compression.ZipArchiveMode]::Create
$zipStream = [System.IO.File]::Open($dest, [System.IO.FileMode]::Create)
$archive = New-Object System.IO.Compression.ZipArchive($zipStream, $mode)

$allFiles = Get-ChildItem -Path $tempFolder -Recurse -File
foreach ($f in $allFiles) {
    $relPath = $f.FullName.Substring($tempFolder.Length + 1).Replace('\', '/')
    $level = [System.IO.Compression.CompressionLevel]::Optimal
    $entry = $archive.CreateEntry($relPath, $level)
    $entryStream = $entry.Open()
    $fileStream = [System.IO.File]::OpenRead($f.FullName)
    $fileStream.CopyTo($entryStream)
    $fileStream.Dispose()
    $entryStream.Dispose()
}

$archive.Dispose()
$zipStream.Dispose()
Remove-Item $tempFolder -Recurse -Force

$zipItem = Get-Item $dest
Write-Host "Created site_deploy.zip! Size: $($zipItem.Length) bytes ($([Math]::Round($zipItem.Length / 1KB, 2)) KB)"
