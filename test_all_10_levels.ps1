$js = Get-Content "c:\Users\Vaishnavi\maze\js\maze.js" -Raw
$matches = [regex]::Matches($js, 'id:\s*(\d+)[^}]*?title:\s*"([^"]+)"[^}]*?subtitle:\s*"([^"]+)"[^}]*?desc:\s*"([^"]+)"[^}]*?layout:\s*\[([\s\S]*?)\]')

function Test-AllLevels() {
    $allOk = $true
    foreach ($m in $matches) {
        $id = $m.Groups[1].Value
        $title = $m.Groups[2].Value
        $raw = $m.Groups[5].Value
        $layout = [regex]::Matches($raw, '"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }

        $w = $layout[0].Length
        $h = $layout.Length
        $p = $null; $k = $null; $e = $null
        for ($z = 0; $z -lt $h; $z++) {
            for ($x = 0; $x -lt $w; $x++) {
                if ($layout[$z][$x] -eq 'P') { $p = @{x=$x; z=$z} }
                if ($layout[$z][$x] -eq 'K') { $k = @{x=$x; z=$z} }
                if ($layout[$z][$x] -eq 'E') { $e = @{x=$x; z=$z} }
            }
        }

        # BFS from P
        $q = New-Object System.Collections.Queue
        $q.Enqueue($p)
        $distP = @{}
        $distP["$($p.x),$($p.z)"] = 0
        $dirs = @(@{dx=0; dz=-1}, @{dx=0; dz=1}, @{dx=-1; dz=0}, @{dx=1; dz=0})

        while ($q.Count -gt 0) {
            $c = $q.Dequeue()
            $curD = $distP["$($c.x),$($c.z)"]
            foreach ($d in $dirs) {
                $nx = $c.x + $d.dx
                $nz = $c.z + $d.dz
                if ($nx -ge 0 -and $nx -lt $w -and $nz -ge 0 -and $nz -lt $h) {
                    if ($layout[$nz][$nx] -ne '#' -and -not $distP.ContainsKey("$nx,$nz")) {
                        $distP["$nx,$nz"] = $curD + 1
                        $q.Enqueue(@{x=$nx; z=$nz})
                    }
                }
            }
        }

        # BFS from K
        $qK = New-Object System.Collections.Queue
        $qK.Enqueue($k)
        $distK = @{}
        $distK["$($k.x),$($k.z)"] = 0
        while ($qK.Count -gt 0) {
            $c = $qK.Dequeue()
            $curD = $distK["$($c.x),$($c.z)"]
            foreach ($d in $dirs) {
                $nx = $c.x + $d.dx
                $nz = $c.z + $d.dz
                if ($nx -ge 0 -and $nx -lt $w -and $nz -ge 0 -and $nz -lt $h) {
                    if ($layout[$nz][$nx] -ne '#' -and -not $distK.ContainsKey("$nx,$nz")) {
                        $distK["$nx,$nz"] = $curD + 1
                        $qK.Enqueue(@{x=$nx; z=$nz})
                    }
                }
            }
        }

        $unreach = @()
        for ($z = 0; $z -lt $h; $z++) {
            for ($x = 0; $x -lt $w; $x++) {
                if ($layout[$z][$x] -ne '#' -and -not $distP.ContainsKey("$x,$z")) {
                    $unreach += "$($layout[$z][$x])($x,$z)"
                }
            }
        }

        $reachK = $distP.ContainsKey("$($k.x),$($k.z)")
        $reachE = $distK.ContainsKey("$($e.x),$($e.z)")
        $distKey = if ($reachK) { $distP["$($k.x),$($k.z)"] } else { -1 }
        $distExit = if ($reachE) { $distK["$($e.x),$($e.z)"] } else { -1 }

        $status = if ($reachK -and $reachE -and $unreach.Count -eq 0) { "PASSED" } else { "FAILED"; $allOk = $false }
        Write-Host ("[{0}] Level {1,2} ({2,-22}): P->K={3,-5} (d={4,2}) | K->E={5,-5} (d={6,2}) | Unreachable={7}" -f $status, $id, $title, $reachK, $distKey, $reachE, $distExit, $unreach.Count)
        if ($unreach.Count -gt 0) {
            Write-Host "   Missing: $($unreach -join ', ')"
        }
    }
    return $allOk
}

$ok = Test-AllLevels
Write-Host ""
Write-Host "ALL LEVELS VERIFICATION RESULT: $ok"
