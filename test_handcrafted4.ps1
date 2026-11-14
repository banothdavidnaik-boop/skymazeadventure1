$handcrafted4 = @(
  "###############",
  "#P..C.#...C...#",
  "#.###.#.#####.#",
  "#.#...#...#...#",
  "#.#.S.###.#.S.#",
  "#...#...#...#.#",
  "###.###.#.###.#",
  "#C..#...B...#.#",
  "#.###.#####.#.#",
  "#...#...#...#K#",
  "###.#.#.###.###",
  "#...#M#...#...#",
  "#.###.###.#.S.#",
  "#C....#C..#..E#",
  "###############"
)

# Test reachability of handcrafted4:
$w = 15; $h = 15
$q = New-Object System.Collections.Queue
$q.Enqueue(@{x=1; z=1})
$vis = @{}
$vis["1,1"] = 0
$dirs = @(@{dx=0; dz=-1}, @{dx=0; dz=1}, @{dx=-1; dz=0}, @{dx=1; dz=0})

while ($q.Count -gt 0) {
    $c = $q.Dequeue()
    $curD = $vis["$($c.x),$($c.z)"]
    foreach ($d in $dirs) {
        $nx = $c.x + $d.dx
        $nz = $c.z + $d.dz
        if ($nx -ge 0 -and $nx -lt $w -and $nz -ge 0 -and $nz -lt $h) {
            if ($handcrafted4[$nz][$nx] -ne '#' -and -not $vis.ContainsKey("$nx,$nz")) {
                $vis["$nx,$nz"] = $curD + 1
                $q.Enqueue(@{x=$nx; z=$nz})
            }
        }
    }
}

$unreach = @()
for ($z = 0; $z -lt $h; $z++) {
    for ($x = 0; $x -lt $w; $x++) {
        if ($handcrafted4[$z][$x] -ne '#' -and -not $vis.ContainsKey("$x,$z")) {
            $unreach += "$($handcrafted4[$z][$x])($x,$z)"
        }
    }
}

Write-Host "Handcrafted4 Unreachable: $($unreach.Count) ($($unreach -join ', '))"
Write-Host "P to K:" ($vis.ContainsKey("13,9")) "dist:" $vis["13,9"]
Write-Host "P to E:" ($vis.ContainsKey("13,13")) "dist:" $vis["13,13"]

