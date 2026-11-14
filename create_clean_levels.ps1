function Generate-Maze($w, $h, $id, $title, $subtitle, $desc, $seed) {
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

    # Carve standard maze with DFS to guarantee a perfect spanning tree (all nodes connected)
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

    $allCells = @(@{x=$startX; z=$startZ; dist=0})

    while ($stack.Count -gt 0) {
        $curr = $stack.Peek()
        $neighbors = @()

        # Shuffle directions
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
            $cellInfo = @{x=$chosen.x; z=$chosen.z; dist=$newDist}
            $stack.Push($cellInfo)
            $allCells += $cellInfo
        } else {
            [void]$stack.Pop()
        }
    }

    # Add loops / multiple paths so it's a fun adventure maze, not just a tree!
    $loopCount = [int](($w * $h) / 35)
    for ($i = 0; $i -lt $loopCount; $i++) {
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

    # Place Key K in a deep dead-end / far junction
    # Sort cells by distance from (1, 1) and distance from exit
    $candidates = $allCells | Where-Object { 
        ($_.x -ne 1 -or $_.z -ne 1) -and 
        ($_.x -ne $exitX -or $_.z -ne $exitZ) -and
        ($_.dist -gt ($w / 2))
    }
    # Pick a cell with high distance from start that is NOT right next to exit
    $keyCell = ($candidates | Sort-Object { 
        $distToExit = [Math]::Abs($_.x - $exitX) + [Math]::Abs($_.z - $exitZ)
        -$_.dist + (20 - $distToExit)
    })[0]

    $grid[$keyCell.z][$keyCell.x] = 'K'

    # Place Checkpoint B (if maze size >= 15)
    if ($w -ge 15) {
        $midCandidates = $allCells | Where-Object {
            ($_.x -ne 1 -or $_.z -ne 1) -and
            ($_.x -ne $exitX -or $_.z -ne $exitZ) -and
            ($_.x -ne $keyCell.x -or $_.z -ne $keyCell.z) -and
            ($_.dist -gt 6 -and $_.dist -lt ($keyCell.dist - 3))
        }
        if ($midCandidates.Count -gt 0) {
            $bCell = ($midCandidates | Sort-Object { [Math]::Abs($_.dist - ($keyCell.dist / 2)) })[0]
            $grid[$bCell.z][$bCell.x] = 'B'
        }
    }

    # Place second checkpoint for very large mazes (size >= 21)
    if ($w -ge 21) {
        $midCandidates2 = $allCells | Where-Object {
            $grid[$_.z][$_.x] -eq '.' -and
            ($_.dist -gt ($keyCell.dist + 4))
        }
        if ($midCandidates2.Count -gt 0) {
            $bCell2 = ($midCandidates2 | Sort-Object { $rng.Next() })[0]
            $grid[$bCell2.z][$bCell2.x] = 'B'
        }
    }

    # Place Hazards and Coins on open '.' spots
    for ($z = 1; $z -lt ($h - 1); $z++) {
        for ($x = 1; $x -lt ($w - 1); $x++) {
            if ($grid[$z][$x] -eq '.') {
                # Don't place hazards right next to P start or K or E
                $distP = [Math]::Abs($x - 1) + [Math]::Abs($z - 1)
                $distK = [Math]::Abs($x - $keyCell.x) + [Math]::Abs($z - $keyCell.z)
                $distE = [Math]::Abs($x - $exitX) + [Math]::Abs($z - $exitZ)

                if ($distP -ge 3 -and $distK -ge 2 -and $distE -ge 2) {
                    $roll = $rng.NextDouble()
                    if ($roll -lt 0.08 -and $id -ge 2) {
                        $grid[$z][$x] = 'S' # Spike
                    } elseif ($roll -lt 0.14 -and $id -ge 3) {
                        $grid[$z][$x] = 'F' # Fire
                    } elseif ($roll -lt 0.18 -and $id -ge 4) {
                        $grid[$z][$x] = 'M' # Sentry
                    } elseif ($roll -lt 0.45) {
                        $grid[$z][$x] = 'C' # Coin
                    }
                } elseif ($rng.NextDouble() -lt 0.4) {
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

    return @{
        id = $id
        title = $title
        subtitle = $subtitle
        desc = $desc
        layout = $layoutLines
        keyPos = $keyCell
    }
}

# Test generating Level 4 (15x15)
$lvl4 = Generate-Maze 15 15 4 "Sentinel Vault" "Level 4 • Moving Sentries" "Patrolling sentry drones guard the key. Reach the checkpoint!" 42
Write-Host "Generated Level 4 layout:"
$lvl4.layout | ForEach-Object { Write-Host $_ }

