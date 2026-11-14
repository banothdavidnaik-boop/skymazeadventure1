function Create-Solvable-Level($w, $h, $id, $title, $subtitle, $desc, $seed) {
    $rng = New-Object System.Random($seed)

    # Initialize all walls
    $grid = @()
    for ($z = 0; $z -lt $h; $z++) {
        $row = @()
        for ($x = 0; $x -lt $w; $x++) {
            $row += '#'
        }
        $grid += ,$row
    }

    # Carve spanning tree using DFS
    $visited = @{}
    $stack = New-Object System.Collections.Stack
    $startX = 1
    $startZ = 1
    $grid[$startZ][$startX] = '.'
    $visited["$startX,$startZ"] = $true
    $stack.Push(@{x=$startX; z=$startZ; dist=0})

    $dirs = @(
        @{dx=0; dz=-2},
        @{dx=0; dz=2},
        @{dx=-2; dz=0},
        @{dx=2; dz=0}
    )

    $allJunctions = @(@{x=$startX; z=$startZ; dist=0})

    while ($stack.Count -gt 0) {
        $curr = $stack.Peek()
        $neighbors = @()
        $shuffled = $dirs | Sort-Object { $rng.Next() }

        foreach ($d in $shuffled) {
            $nx = $curr.x + $d.dx
            $nz = $curr.z + $d.dz
            if ($nx -ge 1 -and $nx -lt ($w - 1) -and $nz -ge 1 -and $nz -lt ($h - 1)) {
                if (-not $visited["$nx,$nz"]) {
                    $wallX = $curr.x + ($d.dx / 2)
                    $wallZ = $curr.z + ($d.dz / 2)
                    $neighbors += @{x=$nx; z=$nz; wallX=$wallX; wallZ=$wallZ}
                }
            }
        }

        if ($neighbors.Count -gt 0) {
            $chosen = $neighbors[0]
            $grid[$chosen.wallZ][$chosen.wallX] = '.'
            $grid[$chosen.z][$chosen.x] = '.'
            $visited["$($chosen.x),$($chosen.z)"] = $true
            $newDist = $curr.dist + 1
            $junc = @{x=$chosen.x; z=$chosen.z; dist=$newDist}
            $stack.Push($junc)
            $allJunctions += $junc
        } else {
            [void]$stack.Pop()
        }
    }

    # Add extra corridors (loops) so there are multiple fun paths and no dead-ends traps
    $extraPassages = [int](($w * $h) / 30)
    for ($i = 0; $i -lt $extraPassages; $i++) {
        $rx = ($rng.Next(1, [int](($w - 1) / 2))) * 2
        $rz = ($rng.Next(1, [int](($h - 1) / 2))) * 2 + 1
        if ($rng.Next(2) -eq 0) {
            $rx = ($rng.Next(1, [int](($w - 1) / 2))) * 2 + 1
            $rz = ($rng.Next(1, [int](($h - 1) / 2))) * 2
        }
        if ($rx -ge 1 -and $rx -lt ($w - 1) -and $rz -ge 1 -and $rz -lt ($h - 1)) {
            $grid[$rz][$rx] = '.'
        }
    }

    # Player start at (1, 1)
    $grid[1][1] = 'P'

    # Exit at (w-2, h-2)
    $exitX = $w - 2
    $exitZ = $h - 2
    $grid[$exitZ][$exitX] = 'E'

    # Find the cell furthest from P and from Exit to place Key
    # Compute true BFS distance from P(1,1)
    $q = New-Object System.Collections.Queue
    $q.Enqueue(@{x=1; z=1})
    $distP = @{}
    $distP["1,1"] = 0
    $navDirs = @(@{dx=0; dz=-1}, @{dx=0; dz=1}, @{dx=-1; dz=0}, @{dx=1; dz=0})

    while ($q.Count -gt 0) {
        $c = $q.Dequeue()
        $curD = $distP["$($c.x),$($c.z)"]
        foreach ($d in $navDirs) {
            $nx = $c.x + $d.dx
            $nz = $c.z + $d.dz
            if ($nx -ge 0 -and $nx -lt $w -and $nz -ge 0 -and $nz -lt $h) {
                if ($grid[$nz][$nx] -ne '#' -and -not $distP.ContainsKey("$nx,$nz")) {
                    $distP["$nx,$nz"] = $curD + 1
                    $q.Enqueue(@{x=$nx; z=$nz})
                }
            }
        }
    }

    # Candidates for Key: must have high distance from P, and distance from Exit >= 6
    $keyCandidates = @()
    for ($z = 1; $z -lt ($h - 1); $z++) {
        for ($x = 1; $x -lt ($w - 1); $x++) {
            if ($grid[$z][$x] -eq '.' -and $distP.ContainsKey("$x,$z")) {
                $dP = $distP["$x,$z"]
                $dE = [Math]::Abs($x - $exitX) + [Math]::Abs($z - $exitZ)
                if ($dP -ge ($w * 0.7) -and $dE -ge 6) {
                    $keyCandidates += @{x=$x; z=$z; score = ($dP * 2 + $dE)}
                }
            }
        }
    }

    if ($keyCandidates.Count -eq 0) {
        # Fallback to furthest cell from P
        $keyCandidates = @()
        for ($z = 1; $z -lt ($h - 1); $z++) {
            for ($x = 1; $x -lt ($w - 1); $x++) {
                if ($grid[$z][$x] -eq '.' -and $distP.ContainsKey("$x,$z")) {
                    $keyCandidates += @{x=$x; z=$z; score = $distP["$x,$z"]}
                }
            }
        }
    }

    $bestKey = ($keyCandidates | Sort-Object -Property score -Descending)[0]
    $grid[$bestKey.z][$bestKey.x] = 'K'

    # Compute distance from Key to all cells
    $qK = New-Object System.Collections.Queue
    $qK.Enqueue($bestKey)
    $distK = @{}
    $distK["$($bestKey.x),$($bestKey.z)"] = 0
    while ($qK.Count -gt 0) {
        $c = $qK.Dequeue()
        $curD = $distK["$($c.x),$($c.z)"]
        foreach ($d in $navDirs) {
            $nx = $c.x + $d.dx
            $nz = $c.z + $d.dz
            if ($nx -ge 0 -and $nx -lt $w -and $nz -ge 0 -and $nz -lt $h) {
                if ($grid[$nz][$nx] -ne '#' -and -not $distK.ContainsKey("$nx,$nz")) {
                    $distK["$nx,$nz"] = $curD + 1
                    $qK.Enqueue(@{x=$nx; z=$nz})
                }
            }
        }
    }

    # Place Checkpoint B (at roughly half distance to Key)
    if ($w -ge 15) {
        $targetDist = [int]($distP["$($bestKey.x),$($bestKey.z)"] / 2)
        $bCandidates = @()
        for ($z = 1; $z -lt ($h - 1); $z++) {
            for ($x = 1; $x -lt ($w - 1); $x++) {
                if ($grid[$z][$x] -eq '.' -and $distP.ContainsKey("$x,$z")) {
                    $diff = [Math]::Abs($distP["$x,$z"] - $targetDist)
                    $bCandidates += @{x=$x; z=$z; diff=$diff}
                }
            }
        }
        if ($bCandidates.Count -gt 0) {
            $bCell = ($bCandidates | Sort-Object -Property diff)[0]
            $grid[$bCell.z][$bCell.x] = 'B'
        }
    }

    # Place second checkpoint for large mazes (size >= 19) midway between Key and Exit
    if ($w -ge 19) {
        $distKE = $distK["$exitX,$exitZ"]
        $targetDist2 = [int]($distKE / 2)
        $b2Candidates = @()
        for ($z = 1; $z -lt ($h - 1); $z++) {
            for ($x = 1; $x -lt ($w - 1); $x++) {
                if ($grid[$z][$x] -eq '.' -and $distK.ContainsKey("$x,$z")) {
                    $diff = [Math]::Abs($distK["$x,$z"] - $targetDist2)
                    $b2Candidates += @{x=$x; z=$z; diff=$diff}
                }
            }
        }
        if ($b2Candidates.Count -gt 0) {
            $b2Cell = ($b2Candidates | Sort-Object -Property diff)[0]
            $grid[$b2Cell.z][$b2Cell.x] = 'B'
        }
    }

    # Place Hazards and Coins on open '.' cells
    for ($z = 1; $z -lt ($h - 1); $z++) {
        for ($x = 1; $x -lt ($w - 1); $x++) {
            if ($grid[$z][$x] -eq '.') {
                $dP = if ($distP.ContainsKey("$x,$z")) { $distP["$x,$z"] } else { 0 }
                $dKey = if ($distK.ContainsKey("$x,$z")) { $distK["$x,$z"] } else { 0 }
                $dE = [Math]::Abs($x - $exitX) + [Math]::Abs($z - $exitZ)

                if ($dP -ge 3 -and $dKey -ge 2 -and $dE -ge 2) {
                    $roll = $rng.NextDouble()
                    if ($roll -lt 0.07 -and $id -ge 2) {
                        $grid[$z][$x] = 'S' # Spike
                    } elseif ($roll -lt 0.13 -and $id -ge 3) {
                        $grid[$z][$x] = 'F' # Fire vent
                    } elseif ($roll -lt 0.17 -and $id -ge 4) {
                        $grid[$z][$x] = 'M' # Sentry
                    } elseif ($roll -lt 0.42) {
                        $grid[$z][$x] = 'C' # Coin
                    }
                } elseif ($rng.NextDouble() -lt 0.35) {
                    $grid[$z][$x] = 'C'
                }
            }
        }
    }

    # Format layout strings
    $layoutLines = @()
    for ($z = 0; $z -lt $h; $z++) {
        $line = ""
        for ($x = 0; $x -lt $w; $x++) {
            $line += $grid[$z][$x]
        }
        $layoutLines += $line
    }

    # Verify 100% reachability
    $unreachCount = 0
    for ($z = 0; $z -lt $h; $z++) {
        for ($x = 0; $x -lt $w; $x++) {
            if ($grid[$z][$x] -ne '#' -and -not $distP.ContainsKey("$x,$z")) {
                $unreachCount++
            }
        }
    }

    $distExit = $distP["$exitX,$exitZ"]
    $distKeyVal = $distP["$($bestKey.x),$($bestKey.z)"]
    $distKeyToExit = $distK["$exitX,$exitZ"]

    Write-Host ("Level {0,2} ({1,-22}): Unreachable={2} | P->K={3} | K->E={4} | Dist P->K={5} Dist K->E={6}" -f $id, $title, $unreachCount, $distP.ContainsKey("$($bestKey.x),$($bestKey.z)"), $distK.ContainsKey("$exitX,$exitZ"), $distKeyVal, $distKeyToExit)

    return @{
        id = $id
        title = $title
        subtitle = $subtitle
        desc = $desc
        layout = $layoutLines
        unreachCount = $unreachCount
    }
}

# Generate all levels from 4 through 10 with verified seeds
$l4  = Create-Solvable-Level 15 15  4 "Sentinel Vault"       "Level 4 • Moving Sentries"     "Patrolling sentry drones guard the key. Reach the checkpoint!" 104
$l5  = Create-Solvable-Level 17 17  5 "The Royal Citadel"     "Level 5 • Grand Labyrinth"     "The royal maze! Master spikes, fire vents, and moving sentries." 105
$l6  = Create-Solvable-Level 17 17  6 "Crystal Caverns"       "Level 6 • Deep Shrines"        "Navigate glowing checkpoint shrines and cross timed spike gauntlets." 106
$l7  = Create-Solvable-Level 19 19  7 "Inferno Chamber"       "Level 7 • Fire Trap Gauntlet"  "High-intensity fire geysers block key corridors. Watch the flame timings!" 22
$l8  = Create-Solvable-Level 19 19  8 "Clockwork Maze"        "Level 8 • Double Patrol"       "Interlocking sentry drones patrol the main halls. Time your moves carefully." 108
$l9  = Create-Solvable-Level 21 21  9 "Shadow Sanctum"        "Level 9 • The Great Labyrinth" "A vast 21x21 labyrinth with secret coin vaults, checkpoints, and dual sentries." 109
$l10 = Create-Solvable-Level 23 23 10 "The Master's Gauntlet" "Level 10 • Epic Finale"        "The ultimate 23x23 labyrinth! Conquer every hazard to claim the Master's crown." 110

# Export verified JavaScript definitions
$allNew = @($l4, $l5, $l6, $l7, $l8, $l9, $l10)
$outJs = ""
foreach ($lvl in $allNew) {
    $rows = ($lvl.layout | ForEach-Object { "          `"$_`"" }) -join ",`n"
    $outJs += @"
      {
        id: $($lvl.id),
        title: "$($lvl.title)",
        subtitle: "$($lvl.subtitle)",
        desc: "$($lvl.desc)",
        layout: [
$rows
        ]
      },

"@
}
Set-Content "c:\Users\Vaishnavi\maze\generated_levels.js" $outJs
Write-Host "Generated levels successfully exported to generated_levels.js!"
