$js = Get-Content "c:\Users\Vaishnavi\maze\js\maze.js" -Raw
$matches = [regex]::Matches($js, 'id:\s*(\d+)[^}]*?title:\s*"([^"]+)"[^}]*?subtitle:\s*"([^"]+)"[^}]*?desc:\s*"([^"]+)"[^}]*?layout:\s*\[([\s\S]*?)\]')

function Test-MazeLevel($lines, $id, $title, $subtitle) {
    $w = $lines[0].Length
    $h = $lines.Length
    $p = $null; $k = $null; $e = $null
    $counts = @{ P=0; K=0; E=0; C=0; S=0; F=0; M=0; B=0; Dot=0 }

    for ($z = 0; $z -lt $h; $z++) {
        for ($x = 0; $x -lt $w; $x++) {
            $ch = [string]$lines[$z][$x]
            if ($ch -eq 'P') { $p = @{x=$x; z=$z}; $counts.P++ }
            elseif ($ch -eq 'K') { $k = @{x=$x; z=$z}; $counts.K++ }
            elseif ($ch -eq 'E') { $e = @{x=$x; z=$z}; $counts.E++ }
            elseif ($ch -eq 'C') { $counts.C++ }
            elseif ($ch -eq 'S') { $counts.S++ }
            elseif ($ch -eq 'F') { $counts.F++ }
            elseif ($ch -eq 'M') { $counts.M++ }
            elseif ($ch -eq 'B') { $counts.B++ }
            elseif ($ch -eq '.') { $counts.Dot++ }
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
                if ($lines[$nz][$nx] -ne '#' -and -not $distP.ContainsKey("$nx,$nz")) {
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
                if ($lines[$nz][$nx] -ne '#' -and -not $distK.ContainsKey("$nx,$nz")) {
                    $distK["$nx,$nz"] = $curD + 1
                    $qK.Enqueue(@{x=$nx; z=$nz})
                }
            }
        }
    }

    # Check unreachable non-wall tiles
    $unreach = @()
    for ($z = 0; $z -lt $h; $z++) {
        for ($x = 0; $x -lt $w; $x++) {
            if ($lines[$z][$x] -ne '#' -and -not $distP.ContainsKey("$x,$z")) {
                $unreach += "$($lines[$z][$x])($x,$z)"
            }
        }
    }

    $reachK = $distP.ContainsKey("$($k.x),$($k.z)")
    $reachE = $distK.ContainsKey("$($e.x),$($e.z)")
    $distKey = if ($reachK) { $distP["$($k.x),$($k.z)"] } else { -1 }
    $distExit = if ($reachE) { $distK["$($e.x),$($e.z)"] } else { -1 }

    $allValid = ($counts.P -eq 1) -and ($counts.K -eq 1) -and ($counts.E -eq 1) -and $reachK -and $reachE -and ($unreach.Count -eq 0)

    $status = if ($allValid) { "PASSED" } else { "FAILED" }

    Write-Host ("[{0}] Level {1,2} ({2,-22}): Size={3,2}x{4,2} | P->K={5,-5} (d={6,2}) | K->E={7,-5} (d={8,2}) | Coins={9,2} Hazards={10,2} Checkpoints={11} Unreach={12}" -f $status, $id, $title, $w, $h, $reachK, $distKey, $reachE, $distExit, $counts.C, ($counts.S + $counts.F + $counts.M), $counts.B, $unreach.Count)
    
    if (-not $allValid) {
        Write-Error "Level $id failed validation! P=$($counts.P) K=$($counts.K) E=$($counts.E) Unreachable=$($unreach.Count)"
    }
    return $allValid
}

$allPassed = $true
foreach ($m in $matches) {
    $id = $m.Groups[1].Value
    $title = $m.Groups[2].Value
    $sub = $m.Groups[3].Value
    $rawLayout = $m.Groups[5].Value
    $lines = [regex]::Matches($rawLayout, '"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
    $ok = Test-MazeLevel $lines $id $title $sub
    if (-not $ok) { $allPassed = $false }
}

Write-Host ""
Write-Host "=========================================="
Write-Host "FINAL VERIFICATION: ALL 10 LEVELS PASSED = $allPassed"
Write-Host "=========================================="
