Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::OpenRead("c:\Users\Vaishnavi\maze\site_deploy.zip")
foreach ($entry in $zip.Entries) {
    Write-Host "$($entry.FullName) ($($entry.Length) bytes)"
}
$zip.Dispose()
