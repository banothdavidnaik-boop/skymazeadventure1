# Level layouts definition
$levels = @(
  # Level 1: 8x8 - Tutorial
  @{
    id = 1
    title = "Greenhorn Garden"
    subtitle = "Level 1 • Tutorial & Basics"
    desc = "Collect the magic key and reach the exit portal!"
    layout = @(
      "########",
      "#P..C..#",
      "#.##.C.#",
      "#...#..#",
      "#.C.#K.#",
      "#.###..#",
      "#...C.E#",
      "########"
    )
  },

  # Level 2: 11x11 - Spike Hazards
  @{
    id = 2
    title = "Azure Corridors"
    subtitle = "Level 2 • Spike Hazards"
    desc = "Watch your step! Timed spikes emerge from the floor."
    layout = @(
      "###########",
      "#P..C.#.C.#",
      "#.###.S.###",
      "#...#...#K#",
      "###.#.###.#",
      "#C..S...#.#",
      "#.#####.S.#",
      "#.#...#...#",
      "#.#.S.###.#",
      "#.C...#C.E#",
      "###########"
    )
  },

  # Level 3: 13x13 - Fire Traps
  @{
    id = 3
    title = "Sunlit Sanctum"
    subtitle = "Level 3 • Fire Traps"
    desc = "Floor vents ignite with fiery blasts! Time your crossing."
    layout = @(
      "#############",
      "#P..C.#...C.#",
      "#.###.#.###.#",
      "#.#...F...#.#",
      "#.#.#####.#.#",
      "#.F...#C..#K#",
      "#.###.#.###.#",
      "#...#...#...#",
      "###.#.###.###",
      "#C..#...F.#E#",
      "#.#####.#.#.#",
      "#.....C...C.#",
      "#############"
    )
  },

  # Level 4: 15x15 - Sentinel Vault (Fixed! Clear open path through checkpoint B, past sentry M, to key K and exit E)
  @{
    id = 4
    title = "Sentinel Vault"
    subtitle = "Level 4 • Moving Sentries"
    desc = "Patrolling sentry drones guard the key. Reach the checkpoint!"
    layout = @(
      "###############",
      "#P..C...#...C.#",
      "#.#####.#.###.#",
      "#.#...#...#...#",
      "#.#.S.###.#.S.#",
      "#...#...#...#.#",
      "###.###.###.#.#",
      "#C..#...B.#.#K#",
      "#.###.###.#.###",
      "#...#...#...#.#",
      "###.#.#.###.#.#",
      "#...#M#...#.#.#",
      "#.###.###.#.S.#",
      "#C....#C..#..E#",
      "###############"
    )
  },

  # Level 5: 17x17 - The Royal Citadel (Fixed! Fully connected with multi-hazards)
  @{
    id = 5
    title = "The Royal Citadel"
    subtitle = "Level 5 • Grand Labyrinth"
    desc = "The royal maze! Master spikes, fire vents, and moving sentries."
    layout = @(
      "#################",
      "#P..C.#...C.#...#",
      "#.###.#.###.#.###",
      "#...#...#...#...#",
      "###.#.###.###.S.#",
      "#C..S...F...#...#",
      "#.#####.###.#.###",
      "#.#...#...#.#...#",
      "#.#.B.#.B.#.#.#K#",
      "#.#...#...#.#.###",
      "#.###.#####.#...#",
      "#...#...M...#S#.#",
      "###.#.#####.#.#.#",
      "#...#...F...#.#.#",
      "#.###.#####.#.#.#",
      "#C....#C....#..E#",
      "#################"
    )
  },

  # Level 6: 17x17 - Crystal Caverns (Fixed! Fully connected)
  @{
    id = 6
    title = "Crystal Caverns"
    subtitle = "Level 6 • Deep Shrines"
    desc = "Navigate glowing checkpoint shrines and cross timed spike gauntlets."
    layout = @(
      "#################",
      "#P..C.#...C...#K#",
      "#.###.#.#####.#.#",
      "#.#...#...#...#.#",
      "#.#.#####.#.###.#",
      "#...#...#.#...#.#",
      "###.#.B.#.###.S.#",
      "#...#...#.#...#.#",
      "#.#####.#.#.###.#",
      "#.#...#...#...#.#",
      "#.#.S.#####.S.#.#",
      "#.#...#...#...#.#",
      "#.###.#.B.#.###.#",
      "#...#...#.#...#.#",
      "###.#####.#.#.#.#",
      "#C....C...#...#E#",
      "#################"
    )
  },

  # Level 7: 19x19 - Inferno Chamber
  @{
    id = 7
    title = "Inferno Chamber"
    subtitle = "Level 7 • Fire Trap Gauntlet"
    desc = "High-intensity fire geysers block key corridors. Watch the flame timings!"
    layout = @(
      "###################",
      "#P..C.#.....C...#K#",
      "#.###.#########.#.#",
      "#...#.#.......#.#.#",
      "###.#.#.#####.#.#.#",
      "#...#...#...#.#.#.#",
      "#.#######.F.#.#.###",
      "#.#.....#...#.#...#",
      "#.#.B.#.#####.###.#",
      "#.#...#...F...#...#",
      "#.#####.#####.#.###",
      "#...F...#...#.#.#.#",
      "###.#####.B.#.#.#.#",
      "#.#...#...#.#.#.#.#",
      "#.#.F.#.###.#.###.#",
      "#.#...#...#.#...#.#",
      "#.#######.#.###.#.#",
      "#C....C...#...C..E#",
      "###################"
    )
  },

  # Level 8: 19x19 - Clockwork Maze
  @{
    id = 8
    title = "Clockwork Maze"
    subtitle = "Level 8 • Double Patrol"
    desc = "Interlocking sentry drones patrol the main halls. Time your moves carefully."
    layout = @(
      "###################",
      "#P..C...#...C...#K#",
      "#.#####.#.#####.#.#",
      "#.#...#...#...#.#.#",
      "#.#.S.#####.S.#.###",
      "#...#...M...#.#...#",
      "###.#########.###.#",
      "#...#...C...#...#.#",
      "#.###.#####.###.#.#",
      "#.#...#...#...#.#.#",
      "#.#.B.###.###.B.#.#",
      "#.#...#...#...#.#.#",
      "#.###.#####.###.#.#",
      "#...#...M...#...#.#",
      "###.#########.###.#",
      "#.#...#...#...#.#.#",
      "#.#.S.###.#.S.#.#.#",
      "#C....#C..#...#..E#",
      "###################"
    )
  },

  # Level 9: 21x21 - Shadow Sanctum
  @{
    id = 9
    title = "Shadow Sanctum"
    subtitle = "Level 9 • The Great Labyrinth"
    desc = "A vast 21x21 labyrinth with secret coin vaults, checkpoints, and dual sentries."
    layout = @(
      "#####################",
      "#P..C.#.....C...#...#",
      "#.###.#########.#.###",
      "#.#...#.......#.#.#K#",
      "#.#.###.#####.#.#.#.#",
      "#...#...#...#...#.#.#",
      "#####.F.#.B.#.F.#.###",
      "#.....#...#...#.#...#",
      "#.#######.#####.###.#",
      "#...M...#...M...#...#",
      "###.###.#####.###.###",
      "#...#...#...#...#...#",
      "#.###.###.B.###.###.#",
      "#.#...#...#...#...#.#",
      "#.#.F.#####.#####.#.#",
      "#.#...#...#...#...#.#",
      "#.#####.S.#.S.#####.#",
      "#...#...#...#...#...#",
      "###.#.#########.#.###",
      "#C..#...C...C...#..E#",
      "#####################"
    )
  },

  # Level 10: 23x23 - The Master's Gauntlet
  @{
    id = 10
    title = "The Master's Gauntlet"
    subtitle = "Level 10 • Epic Finale"
    desc = "The ultimate 23x23 labyrinth! Conquer every hazard to claim the Master's crown."
    layout = @(
      "#######################",
      "#P..C.#.......C...#...#",
      "#.###.###########.#.###",
      "#.#...#.........#.#.#K#",
      "#.#.###.#######.#.#.#.#",
      "#...#...#.....#.#.#.#.#",
      "#####.F.#.B.#.#.#.#.###",
      "#.....#...#.#.#...#...#",
      "#.#######.#.#.#####.###",
      "#...M...#.#.#...M...#.#",
      "###.###.#.#.###.###.#.#",
      "#...#...#.#...#...#.#.#",
      "#.###.###.###.###.#.#.#",
      "#.#...#...#B#...#.#.#.#",
      "#.#.F.#.###.###.#.#.#.#",
      "#.#...#...M...#.#.#.#.#",
      "#.#######.###.#.#.#.#.#",
      "#.#.....#...#.#.#.#.#.#",
      "#.#.B.S.###.#.S.#.B.#.#",
      "#...#...#...#...#...#.#",
      "#####.###.#####.###.###",
      "#C....#...C.F.C...#..E#",
      "#######################"
    )
  }
)

function Test-MazeFull($lvl) {
    $layout = $lvl.layout
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

    $q = New-Object System.Collections.Queue
    $q.Enqueue($p)
    $distMap = @{}
    $distMap["$($p.x),$($p.z)"] = 0
    $dirs = @(@{dx=0; dz=-1}, @{dx=0; dz=1}, @{dx=-1; dz=0}, @{dx=1; dz=0})

    while ($q.Count -gt 0) {
        $c = $q.Dequeue()
        $curD = $distMap["$($c.x),$($c.z)"]
        foreach ($d in $dirs) {
            $nx = $c.x + $d.dx
            $nz = $c.z + $d.dz
            if ($nx -ge 0 -and $nx -lt $w -and $nz -ge 0 -and $nz -lt $h) {
                if ($layout[$nz][$nx] -ne '#' -and -not $distMap.ContainsKey("$nx,$nz")) {
                    $distMap["$nx,$nz"] = $curD + 1
                    $q.Enqueue(@{x=$nx; z=$nz})
                }
            }
        }
    }

    $unreach = @()
    for ($z = 0; $z -lt $h; $z++) {
        for ($x = 0; $x -lt $w; $x++) {
            if ($layout[$z][$x] -ne '#' -and -not $distMap.ContainsKey("$x,$z")) {
                $unreach += "$($layout[$z][$x])($x,$z)"
            }
        }
    }

    $reachK = $distMap.ContainsKey("$($k.x),$($k.z)")
    $reachE = $distMap.ContainsKey("$($e.x),$($e.z)")
    $distK = if ($reachK) { $distMap["$($k.x),$($k.z)"] } else { -1 }
    $distE = if ($reachE) { $distMap["$($e.x),$($e.z)"] } else { -1 }

    Write-Host ("Level {0,2} ({1,-22}): P->K = {2,-5} (dist {3,2}) | P->E = {4,-5} (dist {5,2}) | Unreachable: {6}" -f $lvl.id, $lvl.title, $reachK, $distK, $reachE, $distE, $unreach.Count)
    if ($unreach.Count -gt 0) {
        Write-Host "   Unreachable items: $($unreach -join ', ')"
    }
}

foreach ($lvl in $levels) {
    Test-MazeFull $lvl
}

