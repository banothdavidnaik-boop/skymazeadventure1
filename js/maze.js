/* ========================================================
   3D MAZE ADVENTURE - MAZE GENERATOR & ENVIRONMENT
   Sky-blue maze walls with high contrast floors,
   decorative sconces, exit portals, and level designs
   ======================================================== */

class MazeManager {
  constructor(scene) {
    this.scene = scene;
    this.mazeGroup = new THREE.Group();
    this.scene.add(this.mazeGroup);

    // Wall dimensions
    this.cellSize = 2.5; // units per cell
    this.wallHeight = 2.4;
    this.wallThickness = 0.35;

    // Grid data
    this.grid = [];
    this.width = 0;
    this.height = 0;
    this.startPos = { x: 1, z: 1 };
    this.keyPos = { x: 1, z: 1 };
    this.exitPos = { x: 1, z: 1 };
    this.checkpoints = [];
    this.hazardSpots = [];
    this.coinSpots = [];

    // Collision boxes
    this.wallBoxes = [];
    this.wallMeshes = [];

    // Exit portal references
    this.exitPortalGroup = null;
    this.exitBarrier = null;
    this.exitVortex = null;
    this.exitLight = null;
    this.isExitUnlocked = false;

    // Pre-create shared materials for sky-blue walls and warm floor
    this.initMaterials();
  }

  initMaterials() {
    // Sky-blue walls (Vibrant, high-contrast, polished)
    this.matWall = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Sky Blue
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0
    });

    // Wall cap / beveled top molding (lighter sky blue)
    this.matWallCap = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc, // Light Sky Blue
      roughness: 0.25,
      metalness: 0.15
    });

    // Wall base trim (darker teal-blue)
    this.matWallBase = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.5,
      metalness: 0.1
    });

    // Warm sandstone / checkerboard floor tiles (contrasts vividly with sky-blue walls)
    this.matFloorA = new THREE.MeshStandardMaterial({
      color: 0xeee4d6, // Warm light sandstone
      roughness: 0.7,
      metalness: 0.05
    });
    this.matFloorB = new THREE.MeshStandardMaterial({
      color: 0xdecbb4, // Warm darker sandstone
      roughness: 0.75,
      metalness: 0.05
    });

    // Torch / Sconce material
    this.matTorch = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    this.matFlame = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  }

  /* ========================================================
     LEVEL DEFINITIONS
     Handcrafted progressive layouts + Procedural generator
     ======================================================== */
  static getLevels() {
    return [
      {
        id: 1,
        title: "Greenhorn Garden",
        subtitle: "Level 1 • Tutorial & Basics",
        desc: "Collect the magic key and reach the exit portal!",
        layout: [
          "########",
          "#P..C..#",
          "#.##.C.#",
          "#...#..#",
          "#.C.#K.#",
          "#.###..#",
          "#...C.E#",
          "########"
        ]
      },
      {
        id: 2,
        title: "Azure Corridors",
        subtitle: "Level 2 • Spike Hazards",
        desc: "Watch your step! Timed spikes emerge from the floor.",
        layout: [
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
        ]
      },
      {
        id: 3,
        title: "Sunlit Sanctum",
        subtitle: "Level 3 • Fire Traps",
        desc: "Floor vents ignite with fiery blasts! Time your crossing.",
        layout: [
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
        ]
      },
      {
        id: 4,
        title: "Sentinel Vault",
        subtitle: "Level 4 • Moving Sentries",
        desc: "Patrolling sentry drones guard the key. Reach the checkpoint!",
        layout: [
          "###############",
          "#P#CC.#.....SF#",
          "#.#C#.#C#C###.#",
          "#.#M#C.F#..C..#",
          "#C#S#####.###C#",
          "#.#.C.#...#C#C#",
          "#S###S#F###.#.#",
          "#.#C..#...#C..#",
          "#.###K###.#.###",
          "#.#.S...B.#C#.#",
          "#F#S#######.#.#",
          "#S#.#.C.#.CF#.#",
          "#C#S#.#F#.###.#",
          "#...#.#C...C.E#",
          "###############"
        ]
      },
      {
        id: 5,
        title: "The Royal Citadel",
        subtitle: "Level 5 • Grand Labyrinth",
        desc: "The royal maze! Master spikes, fire vents, and moving sentries.",
        layout: [
          "#################",
          "#P#C.S.MS...#.CC#",
          "#.###.#C###C#.#.#",
          "#.FCC..C#.#.#.#.#",
          "###C#.#.#C#C#.#C#",
          "#...#M#.C.C..C#C#",
          "#S#.#S#F#######.#",
          "#.#.#S#.C.#.CC..#",
          "###.#.#C#.#.#####",
          "#M.C#.#.#C#CC.#.#",
          "#C#C#.###.###.#C#",
          "#.#B....K.#CS.#.#",
          "#.#########C###C#",
          "#.S....S..#F.C.C#",
          "#.#######M###C#.#",
          "#..C.C..#...C..E#",
          "#################"
        ]
      },
      {
        id: 6,
        title: "Crystal Caverns",
        subtitle: "Level 6 • Deep Shrines",
        desc: "Navigate glowing checkpoint shrines and cross timed spike gauntlets.",
        layout: [
          "#################",
          "#P..#M..C...CC..#",
          "###C#######.###.#",
          "#.#.F..MC...#S#C#",
          "#.#.#.###.###C#C#",
          "#..F#.....C...MC#",
          "#C###.###########",
          "#.FC..#.CCCM#C..#",
          "#C#####.###C###.#",
          "#.#...C.#M#....C#",
          "#F#.#.#F#S#.#.#.#",
          "#B#.#.KC#...#..C#",
          "#.#.#######C###C#",
          "#...#.#.CMF.#...#",
          "#####.#M#.###C###",
          "#..C..MS.CS..C.E#",
          "#################"
        ]
      },
      {
        id: 7,
        title: "Inferno Chamber",
        subtitle: "Level 7 • Fire Trap Gauntlet",
        desc: "High-intensity fire geysers block key corridors. Watch the flame timings!",
        layout: [
          "###################",
          "#P..M.#MC.S.SSS...#",
          "#####.#.###########",
          "#.CCCM#..C.F.....S#",
          "#.###.#F#########.#",
          "#..S..#.C.#.....#.#",
          "#####F###.#.#C###.#",
          "#MC.CM#.#..C#M#...#",
          "#.#####C###.###.#C#",
          "#.#.CC..SC..#S.M#C#",
          "#.###########.###.#",
          "#C#....F#SM..M#.#.#",
          "#.#K###B#B#####.#C#",
          "#.#C#...#C.C#.C.#.#",
          "#.#.#.#####.#F###.#",
          "#.#C#C#C..#C#FMS#.#",
          "#.#.#C#S#C#.#F#C#.#",
          "#S..#MSC#CC.#.#..E#",
          "###################"
        ]
      },
      {
        id: 8,
        title: "Clockwork Maze",
        subtitle: "Level 8 • Double Patrol",
        desc: "Interlocking sentry drones patrol the main halls. Time your moves carefully.",
        layout: [
          "###################",
          "#P#S.CS...#C.C#.CC#",
          "#C###C#.#S#.#.###C#",
          "#.SC#.#.#M..#...#.#",
          "###C###C#######.#C#",
          "#C#.C...#..SF.#.MC#",
          "#.###.###.###M###.#",
          "#SC....S..#.#CSSCS#",
          "#.#.#######C#######",
          "#C#.#.C.C..S.C.SFM#",
          "#.#.#.#C#########.#",
          "#.#...#CS.S.#.#F..#",
          "#C#B#K#####B#C#C###",
          "#.#...SC#..CS.F.#C#",
          "#.#####C#C###.###.#",
          "#CC.M.#.#C#.C.#...#",
          "#####.###.#F#####C#",
          "#S...CS.MC#.FCF..E#",
          "###################"
        ]
      },
      {
        id: 9,
        title: "Shadow Sanctum",
        subtitle: "Level 9 • The Great Labyrinth",
        desc: "A vast 21x21 labyrinth with secret coin vaults, checkpoints, and dual sentries.",
        layout: [
          "#####################",
          "#P#.C..CF..FF...#.CC#",
          "#C#.###########F#.#.#",
          "#...#...CM...CSC#.#C#",
          "#####.###########.#.#",
          "#CC.#.#.S.M...FC#.#.#",
          "#.#.#.#.#.#####.#C###",
          "#C#.#CSC.C.S#...#.C.#",
          "#C#.#######.#.#####C#",
          "#.C..C.FC.#C#.#CF.#.#",
          "#C#######C#.#.#.#.#F#",
          "#..C.C.S#CC.#.C.#.#.#",
          "#######.#####.#.#.#.#",
          "#..M.C.C#.K.SCSB#B..#",
          "#.###.###C#####.###C#",
          "#CCC#F..#..S#C..#.M.#",
          "#F#F#.#.###.#.###C###",
          "#.#C#C#....C#S.S.C..#",
          "#.#.#F#####.#####F#C#",
          "#C#.MC......M.F....E#",
          "#####################"
        ]
      },
      {
        id: 10,
        title: "The Master's Gauntlet",
        subtitle: "Level 10 • Epic Finale",
        desc: "The ultimate 23x23 labyrinth! Conquer every hazard to claim the Master's crown.",
        layout: [
          "#######################",
          "#PC.C...#.CS...F#M..#.#",
          "#######.#.#C###F#.#C#.#",
          "#CFC.S#C#C.C#.C..C#S..#",
          "#C#.###M###S#######.#.#",
          "#C#.SM#C..#.CC#.#M..#.#",
          "#C###.###C###C#C#.###.#",
          "#S#.#C..#..CC.#.#C#SC.#",
          "#C#C###S#######C#.#.#.#",
          "#MC...#S..#..C#C.C#.#C#",
          "#####.#C#.#M#S#F###.###",
          "#CCCCCFC#.#.#CC.#CC...#",
          "#.#C###.#.#F#########.#",
          "#.#.#...#F#...S.MS....#",
          "###C#.###C###########M#",
          "#M..#K.F#B#B.M..C.C...#",
          "#.###C###.#.###########",
          "#S#....C.CF...C.....#.#",
          "#C#.###.#.#########.#.#",
          "#.#.CS#...#..C.CC.#.#.#",
          "#C###S###.#F#.#####C#.#",
          "#M...C.C#C..#..CSFFCCE#",
          "#######################"
        ]
      }
    ];
  }

  /* Load Level by Index */
  loadLevel(levelIndex) {
    const levels = MazeManager.getLevels();
    let levelData;

    if (levelIndex <= levels.length) {
      levelData = levels[levelIndex - 1];
    } else {
      // Procedural generation for higher levels!
      const size = Math.min(27, 13 + Math.floor((levelIndex - 10) * 2));
      levelData = this.generateProceduralLevel(levelIndex, size);
    }

    this.buildFromLayout(levelData);
    return levelData;
  }

  /* Parse Layout & Construct 3D Maze */
  buildFromLayout(levelData) {
    // Clear existing maze objects
    while (this.mazeGroup.children.length > 0) {
      this.mazeGroup.remove(this.mazeGroup.children[0]);
    }

    this.wallBoxes = [];
    this.wallMeshes = [];
    this.checkpoints = [];
    this.hazardSpots = [];
    this.coinSpots = [];
    this.isExitUnlocked = false;

    const layout = levelData.layout;
    this.height = layout.length;
    this.width = layout[0].length;
    this.grid = [];

    // Parse grid layout symbols:
    // '#' = Wall, '.' = Open path, 'P' = Player Start, 'K' = Key, 'E' = Exit
    // 'C' = Coin cache, 'S' = Spike Trap, 'F' = Fire Trap, 'M' = Moving Sentry, 'B' = Checkpoint Beacon
    for (let z = 0; z < this.height; z++) {
      this.grid[z] = [];
      for (let x = 0; x < this.width; x++) {
        const char = layout[z][x];
        this.grid[z][x] = char;

        const worldX = (x - this.width / 2) * this.cellSize;
        const worldZ = (z - this.height / 2) * this.cellSize;

        if (char === 'P') {
          this.startPos = { x: worldX, z: worldZ };
        } else if (char === 'K') {
          this.keyPos = { x: worldX, z: worldZ };
        } else if (char === 'E') {
          this.exitPos = { x: worldX, z: worldZ };
        } else if (char === 'B') {
          this.checkpoints.push({ x: worldX, z: worldZ });
        } else if (char === 'S') {
          this.hazardSpots.push({ type: 'spike', x: worldX, z: worldZ });
        } else if (char === 'F') {
          this.hazardSpots.push({ type: 'fire', x: worldX, z: worldZ });
        } else if (char === 'M') {
          this.hazardSpots.push({ type: 'sentry', x: worldX, z: worldZ });
        }

        // Add coins: place on 'C' spots and along open paths
        if (char === 'C' || (char === '.' && Math.random() < 0.35)) {
          this.coinSpots.push({ x: worldX, z: worldZ });
        }
      }
    }

    // Build floor tiles
    this.buildFloor();

    // Build walls & architectural details
    this.buildWalls();

    // Build Exit Portal
    this.buildExitPortal();

    // Build Sky & Boundary accents
    this.buildEnvironment();
  }

  /* Checkerboard Warm Stone Floor */
  buildFloor() {
    const floorGroup = new THREE.Group();
    const halfSize = this.cellSize * 0.495;
    const tileGeo = new THREE.PlaneGeometry(halfSize * 2, halfSize * 2);
    tileGeo.rotateX(-Math.PI / 2);

    for (let z = 0; z < this.height; z++) {
      for (let x = 0; x < this.width; x++) {
        const worldX = (x - this.width / 2) * this.cellSize;
        const worldZ = (z - this.height / 2) * this.cellSize;
        const mat = (x + z) % 2 === 0 ? this.matFloorA : this.matFloorB;

        const tile = new THREE.Mesh(tileGeo, mat);
        tile.position.set(worldX, 0, worldZ);
        tile.receiveShadow = true;
        floorGroup.add(tile);
      }
    }
    this.mazeGroup.add(floorGroup);
  }

  /* Sky-Blue Maze Walls with Top Molding and Torches */
  buildWalls() {
    const wallGeo = new THREE.BoxGeometry(this.cellSize, this.wallHeight, this.cellSize);
    const capGeo = new THREE.BoxGeometry(this.cellSize * 1.04, 0.16, this.cellSize * 1.04);
    const baseGeo = new THREE.BoxGeometry(this.cellSize * 1.02, 0.18, this.cellSize * 1.02);

    for (let z = 0; z < this.height; z++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[z][x] === '#') {
          const worldX = (x - this.width / 2) * this.cellSize;
          const worldZ = (z - this.height / 2) * this.cellSize;

          // Main Wall Block
          const wallMesh = new THREE.Mesh(wallGeo, this.matWall.clone());
          wallMesh.position.set(worldX, this.wallHeight / 2, worldZ);
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          this.mazeGroup.add(wallMesh);
          this.wallMeshes.push(wallMesh);

          // Top Beveled Cap (lighter sky-blue trim)
          const capMesh = new THREE.Mesh(capGeo, this.matWallCap);
          capMesh.position.set(worldX, this.wallHeight + 0.08, worldZ);
          capMesh.castShadow = true;
          this.mazeGroup.add(capMesh);

          // Base Molding
          const baseMesh = new THREE.Mesh(baseGeo, this.matWallBase);
          baseMesh.position.set(worldX, 0.09, worldZ);
          this.mazeGroup.add(baseMesh);

          // Collision box
          const half = this.cellSize / 2;
          this.wallBoxes.push({
            minX: worldX - half,
            maxX: worldX + half,
            minZ: worldZ - half,
            maxZ: worldZ + half
          });

          // Add decorative warm sconce light on selected inner walls
          if ((x + z) % 4 === 0 && x > 0 && x < this.width - 1 && z > 0 && z < this.height - 1) {
            this.addWallTorch(worldX, worldZ);
          }
        }
      }
    }
  }

  /* Stylized Wall Torch / Crystal Sconce */
  addWallTorch(x, z) {
    const sconce = new THREE.Group();
    sconce.position.set(x, this.wallHeight * 0.65, z);

    // Wall bracket
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.12), this.matTorch);
    sconce.add(bracket);

    // Glowing crystal flame
    const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), this.matFlame);
    flame.position.y = 0.22;
    sconce.add(flame);

    // Warm localized light
    const light = new THREE.PointLight(0xffaa44, 0.6, 5.0);
    light.position.y = 0.25;
    sconce.add(light);

    this.mazeGroup.add(sconce);
  }

  /* Exit Portal Arch with Swirling Vortex & Barrier */
  buildExitPortal() {
    this.exitPortalGroup = new THREE.Group();
    this.exitPortalGroup.position.set(this.exitPos.x, 0, this.exitPos.z);

    // Portal Arch Frame (Pillars + Crossbar)
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.3, metalness: 0.4 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.8 });

    // Left Pillar
    const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2.6, 8), pillarMat);
    leftPillar.position.set(-1.0, 1.3, 0);
    this.exitPortalGroup.add(leftPillar);

    // Right Pillar
    const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 2.6, 8), pillarMat);
    rightPillar.position.set(1.0, 1.3, 0);
    this.exitPortalGroup.add(rightPillar);

    // Arch Crossbar
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.45), pillarMat);
    crossbar.position.set(0, 2.6, 0);
    this.exitPortalGroup.add(crossbar);

    // Golden Rune Crest
    const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), goldMat);
    crest.position.set(0, 2.9, 0);
    this.exitPortalGroup.add(crest);

    // Locked Energy Barrier (laser grid when key is uncollected)
    const barrierGeo = new THREE.PlaneGeometry(1.8, 2.4);
    const barrierMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    this.exitBarrier = new THREE.Mesh(barrierGeo, barrierMat);
    this.exitBarrier.position.set(0, 1.2, 0);
    this.exitPortalGroup.add(this.exitBarrier);

    // Swirling Mystical Vortex Disc (activates when key is collected!)
    const vortexGeo = new THREE.RingGeometry(0.1, 1.1, 32);
    const vortexMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    this.exitVortex = new THREE.Mesh(vortexGeo, vortexMat);
    this.exitVortex.position.set(0, 1.2, 0);
    this.exitVortex.visible = false;
    this.exitPortalGroup.add(this.exitVortex);

    // Portal Glow Light
    this.exitLight = new THREE.PointLight(0xef4444, 1.2, 6.0);
    this.exitLight.position.set(0, 1.5, 0);
    this.exitPortalGroup.add(this.exitLight);

    this.mazeGroup.add(this.exitPortalGroup);
  }

  /* Unlock Exit Portal */
  unlockExit() {
    this.isExitUnlocked = true;
    if (this.exitBarrier) this.exitBarrier.visible = false;
    if (this.exitVortex) this.exitVortex.visible = true;
    if (this.exitLight) {
      this.exitLight.color.setHex(0x38bdf8); // Glowing sky-blue cyan
      this.exitLight.intensity = 2.0;
    }
    if (window.audioManager) {
      window.audioManager.playUnlockExit();
    }
  }

  /* Update Exit Portal Animation (swirl vortex & pulse light) */
  update(delta) {
    if (this.exitVortex && this.exitVortex.visible) {
      this.exitVortex.rotation.z += delta * 2.5;
      const pulse = 1.6 + Math.sin(Date.now() * 0.005) * 0.5;
      if (this.exitLight) this.exitLight.intensity = pulse;
    }
  }

  /* Surrounding stylized backdrop & sky */
  buildEnvironment() {
    // Ground exterior border
    const borderGeo = new THREE.PlaneGeometry(this.width * this.cellSize + 20, this.height * this.cellSize + 20);
    borderGeo.rotateX(-Math.PI / 2);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x0b1325, roughness: 0.9 });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = -0.05;
    this.mazeGroup.add(border);
  }

  /* Fast Circle vs Wall AABB Collision Check */
  checkCollision(x, z, radius) {
    for (let i = 0; i < this.wallBoxes.length; i++) {
      const box = this.wallBoxes[i];
      // Find closest point on box to circle center
      const closestX = Math.max(box.minX, Math.min(x, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(z, box.maxZ));

      const dx = x - closestX;
      const dz = z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        return true; // Collision detected!
      }
    }
    return false;
  }

  /* Procedural Maze Generator (DFS Recursive Backtracker) */
  generateProceduralLevel(levelIndex, size = 15) {
    // Must be odd dimensions
    const w = size % 2 === 0 ? size + 1 : size;
    const h = w;

    for (let attempt = 0; attempt < 20; attempt++) {
      // Initialize full walls
      const grid = [];
      for (let z = 0; z < h; z++) {
        grid[z] = [];
        for (let x = 0; x < w; x++) {
          grid[z][x] = '#';
        }
      }

      // Carve passages using DFS
      const stack = [];
      const startX = 1;
      const startZ = 1;
      grid[startZ][startX] = '.';
      stack.push({ x: startX, z: startZ });

      const directions = [
        { dx: 0, dz: -2 },
        { dx: 0, dz: 2 },
        { dx: -2, dz: 0 },
        { dx: 2, dz: 0 }
      ];

      while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = [];

        // Shuffle directions
        const shuffled = directions.slice().sort(() => Math.random() - 0.5);

        for (const dir of shuffled) {
          const nx = current.x + dir.dx;
          const nz = current.z + dir.dz;
          if (nx > 0 && nx < w - 1 && nz > 0 && nz < h - 1 && grid[nz][nx] === '#') {
            neighbors.push({ x: nx, z: nz, wallX: current.x + dir.dx / 2, wallZ: current.z + dir.dz / 2 });
          }
        }

        if (neighbors.length > 0) {
          const chosen = neighbors[0];
          grid[chosen.wallZ][chosen.wallX] = '.';
          grid[chosen.z][chosen.x] = '.';
          stack.push({ x: chosen.x, z: chosen.z });
        } else {
          stack.pop();
        }
      }

      // Add extra corridors (loops) so there are alternate pathways
      const extraPassages = Math.floor((w * h) / 35);
      for (let i = 0; i < extraPassages; i++) {
        const rx = 1 + Math.floor(Math.random() * (w - 2));
        const rz = 1 + Math.floor(Math.random() * (h - 2));
        if (grid[rz][rx] === '#') {
          const hOpen = (rx > 0 && rx < w - 1 && grid[rz][rx - 1] !== '#' && grid[rz][rx + 1] !== '#');
          const vOpen = (rz > 0 && rz < h - 1 && grid[rz - 1][rx] !== '#' && grid[rz + 1][rx] !== '#');
          if (hOpen || vOpen) {
            grid[rz][rx] = '.';
          }
        }
      }

      // BFS from Player start (1, 1)
      const q = [{ x: startX, z: startZ, dist: 0 }];
      const distFromStart = new Map();
      distFromStart.set(`${startX},${startZ}`, 0);
      const navDirs = [{ dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 }];

      while (q.length > 0) {
        const c = q.shift();
        for (const d of navDirs) {
          const nx = c.x + d.dx;
          const nz = c.z + d.dz;
          const key = `${nx},${nz}`;
          if (nx >= 0 && nx < w && nz >= 0 && nz < h && grid[nz][nx] !== '#' && !distFromStart.has(key)) {
            distFromStart.set(key, c.dist + 1);
            q.push({ x: nx, z: nz, dist: c.dist + 1 });
          }
        }
      }

      // Choose Exit location: prefer (w-2, h-2) if reachable, otherwise furthest reachable cell from start
      let exitPos = { x: w - 2, z: h - 2 };
      if (!distFromStart.has(`${exitPos.x},${exitPos.z}`) || (exitPos.x === startX && exitPos.z === startZ)) {
        let maxD = -1;
        for (const [key, d] of distFromStart.entries()) {
          const [cx, cz] = key.split(',').map(Number);
          if (d > maxD) {
            maxD = d;
            exitPos = { x: cx, z: cz };
          }
        }
      }

      // BFS from Exit location
      const qE = [{ x: exitPos.x, z: exitPos.z, dist: 0 }];
      const distFromExit = new Map();
      distFromExit.set(`${exitPos.x},${exitPos.z}`, 0);

      while (qE.length > 0) {
        const c = qE.shift();
        for (const d of navDirs) {
          const nx = c.x + d.dx;
          const nz = c.z + d.dz;
          const key = `${nx},${nz}`;
          if (nx >= 0 && nx < w && nz >= 0 && nz < h && grid[nz][nx] !== '#' && !distFromExit.has(key)) {
            distFromExit.set(key, c.dist + 1);
            qE.push({ x: nx, z: nz, dist: c.dist + 1 });
          }
        }
      }

      // Pick Key position: reachable cell that maximizes distance from both Start and Exit
      let bestKeyPos = null;
      let bestKeyScore = -1;

      for (const [coordStr, dP] of distFromStart.entries()) {
        const [cx, cz] = coordStr.split(',').map(Number);
        if ((cx === startX && cz === startZ) || (cx === exitPos.x && cz === exitPos.z)) continue;
        const dE = distFromExit.get(coordStr) || 0;
        const score = Math.min(dP, dE) * 2 + (dP + dE);
        if (score > bestKeyScore) {
          bestKeyScore = score;
          bestKeyPos = { x: cx, z: cz };
        }
      }

      if (!bestKeyPos) continue;

      // Place P, K, and E
      grid[startZ][startX] = 'P';
      grid[bestKeyPos.z][bestKeyPos.x] = 'K';
      grid[exitPos.z][exitPos.x] = 'E';

      // Place Checkpoint B (midway to Key)
      if (w >= 15) {
        const targetD = Math.floor((distFromStart.get(`${bestKeyPos.x},${bestKeyPos.z}`) || 0) / 2);
        let bestB = null;
        let minDiff = Infinity;
        for (const [coordStr, dP] of distFromStart.entries()) {
          const [cx, cz] = coordStr.split(',').map(Number);
          if (grid[cz][cx] === '.') {
            const diff = Math.abs(dP - targetD);
            if (diff < minDiff) {
              minDiff = diff;
              bestB = { x: cx, z: cz };
            }
          }
        }
        if (bestB) grid[bestB.z][bestB.x] = 'B';
      }

      // Scatter hazards & coins in open cells away from P, K, E
      for (let z = 1; z < h - 1; z++) {
        for (let x = 1; x < w - 1; x++) {
          if (grid[z][x] === '.') {
            const dP = distFromStart.get(`${x},${z}`) || 0;
            const dE = distFromExit.get(`${x},${z}`) || 0;
            const dK = Math.abs(x - bestKeyPos.x) + Math.abs(z - bestKeyPos.z);

            if (dP >= 2 && dE >= 2 && dK >= 2) {
              const rand = Math.random();
              if (rand < 0.08) {
                grid[z][x] = 'S'; // Spike trap
              } else if (rand < 0.14) {
                grid[z][x] = 'F'; // Fire hazard
              } else if (rand < 0.18) {
                grid[z][x] = 'M'; // Moving sentry
              } else if (rand < 0.45) {
                grid[z][x] = 'C'; // Coin cache
              }
            } else if (Math.random() < 0.3) {
              grid[z][x] = 'C';
            }
          }
        }
      }

      return {
        id: levelIndex,
        title: `Labyrinth of Eternity ${levelIndex}`,
        subtitle: `Level ${levelIndex} • Deep Maze`,
        desc: "Navigate the deep procedural corridors to reach the portal!",
        layout: grid.map(row => row.join(''))
      };
    }
  }
}

