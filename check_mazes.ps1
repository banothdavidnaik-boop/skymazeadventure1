$js = Get-Content "c:\Users\Vaishnavi\maze\js\maze.js" -Raw
$matches = [regex]::Matches($js, 'id:\s*(\d+)[^}]*?title:\s*"([^"]+)"[^}]*?layout:\s*\[([\s\S]*?)\]')

function Find-Path($lines, $from, $to) {
    $w = $lines[0].Length
    $h = $lines.Length
    $q = New-Object System.Collections.Queue
    $q.Enqueue($from)
    $vis = @{}
    $vis["$($from.x),$($from.z)"] = $true
    $dirs = @(@{dx=0; dz=-1}, @{dx=0; dz=1}, @{dx=-1; dz=0}, @{dx=1; dz=0})

    while ($q.Count -gt 0) {
        $c = $q.Dequeue()
        if ($c.x -eq $to.x -and $c.z -eq $to.z) { return $true }
        foreach ($d in $dirs) {
            $nx = $c.x + $d.dx
            $nz = $c.z + $d.dz
            if ($nx -ge 0 -and $nx -lt $w -and $nz -ge 0 -and $nz -lt $h) {
                if ($lines[$nz][$nx] -ne '#' -and -not $vis["$nx,$nz"]) {
                    $vis["$nx,$nz"] = $true
                    $q.Enqueue(@{x=$nx; z=$nz})
                }
            }
        }
    }
    return $false
}

foreach ($m in $matches) {
    $id = $m.Groups[1].Value
    $title = $m.Groups[2].Value
    $rawLayout = $m.Groups[3].Value
    $lines = [regex]::Matches($rawLayout, '"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }

    $w = $lines[0].Length
    $h = $lines.Length

    $p = $null; $k = $null; $e = $null
    for ($z = 0; $z -lt $h; $z++) {
        for ($x = 0; $x -lt $w; $x++) {
            if ($lines[$z][$x] -eq 'P') { $p = @{x=$x; z=$z} }
            if ($lines[$z][$x] -eq 'K') { $k = @{x=$x; z=$z} }
            if ($lines[$z][$x] -eq 'E') { $e = @{x=$x; z=$z} }
        }
    }

    $reachK = Find-Path $lines $p $k
    $reachE = Find-Path $lines $k $e
    Write-Host ("Level {0,2} ({1,-22}): P->K = {2,-5} | K->E = {3,-5} | P=({4,2},{5,2}) K=({6,2},{7,2}) E=({8,2},{9,2})" -f $id, $title, $reachK, $reachE, $p.x, $p.z, $k.x, $k.z, $e.x, $e.z)
}

