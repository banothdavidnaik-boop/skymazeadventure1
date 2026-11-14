/* ========================================================
   3D MAZE ADVENTURE - COLLECTIBLE ITEMS
   Magic Keys & Persistent Gold Coins with 3D animations,
   sparkle effects, and pickup audio
   ======================================================== */

class ItemManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.coins = [];
    this.keyItem = null;
    this.hasKey = false;
    this.totalLevelCoins = 0;
    this.collectedLevelCoins = 0;

    // Pickup particle pool
    this.particles = [];

    // Pre-create shared assets
    this.initAssets();
  }

  initAssets() {
    // 1. Gold Coin Materials & Geometries
    this.geoCoin = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16);
    this.matCoin = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber Gold
      roughness: 0.2,
      metalness: 0.85,
      emissive: 0xd97706,
      emissiveIntensity: 0.2
    });

    // Embossed star / center rim
    this.geoCoinRim = new THREE.TorusGeometry(0.18, 0.025, 8, 16);
    this.matCoinRim = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.1,
      metalness: 0.9
    });

    // 2. Magic Key Materials & Geometries
    this.matKeyGold = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.3
    });
    this.matKeyGem = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.3,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.6
    });

    // Pickup particle geometry
    this.geoParticle = new THREE.DodecahedronGeometry(0.06);
    this.matParticle = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  }

  /* Clear all items from scene */
  clear() {
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.coins = [];
    this.keyItem = null;
    this.hasKey = false;
    this.totalLevelCoins = 0;
    this.collectedLevelCoins = 0;
  }

  /* Populate level items from maze data */
  populate(mazeManager) {
    this.clear();

    // 1. Spawn Magic Key
    this.spawnKey(mazeManager.keyPos.x, mazeManager.keyPos.z);

    // 2. Spawn Gold Coins
    mazeManager.coinSpots.forEach(pos => {
      this.spawnCoin(pos.x, pos.z);
    });

    this.totalLevelCoins = this.coins.length;
  }

  /* 3D Stylized Magic Key */
  spawnKey(x, z) {
    const keyGroup = new THREE.Group();
    keyGroup.position.set(x, 0.9, z);

    // Key Bow (top circular handle loop)
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.05, 8, 24), this.matKeyGold);
    bow.position.y = 0.55;
    keyGroup.add(bow);

    // Embedded shining gem in center of loop
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), this.matKeyGem);
    gem.position.y = 0.55;
    keyGroup.add(gem);

    // Key Stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 8), this.matKeyGold);
    stem.position.y = 0.15;
    keyGroup.add(stem);

    // Key Teeth / Bit
    const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.06), this.matKeyGold);
    tooth1.position.set(0.09, -0.08, 0);
    const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.06), this.matKeyGold);
    tooth2.position.set(0.07, -0.16, 0);
    keyGroup.add(tooth1);
    keyGroup.add(tooth2);

    // Golden Aura Halo / Light
    const keyLight = new THREE.PointLight(0xfbbf24, 1.5, 5.0);
    keyLight.position.y = 0.4;
    keyGroup.add(keyLight);

    // Shimmering ground halo ring
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.45, 16),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -0.88;
    keyGroup.add(halo);

    this.group.add(keyGroup);

    this.keyItem = {
      group: keyGroup,
      x: x,
      z: z,
      radius: 0.7,
      baseY: 0.9,
      collected: false
    };
  }

  /* 3D Shiny Gold Coin */
  spawnCoin(x, z) {
    const coinGroup = new THREE.Group();
    coinGroup.position.set(x, 0.7, z);

    // Main Coin Cylinder
    const coinMesh = new THREE.Mesh(this.geoCoin, this.matCoin);
    coinMesh.rotation.x = Math.PI / 2; // Stand vertically
    coinMesh.castShadow = true;
    coinGroup.add(coinMesh);

    // Embossed decorative rim
    const rimFront = new THREE.Mesh(this.geoCoinRim, this.matCoinRim);
    rimFront.position.z = 0.035;
    coinMesh.add(rimFront);
    const rimBack = new THREE.Mesh(this.geoCoinRim, this.matCoinRim);
    rimBack.position.z = -0.035;
    coinMesh.add(rimBack);

    this.group.add(coinGroup);

    this.coins.push({
      group: coinGroup,
      coinMesh: coinMesh,
      x: x,
      z: z,
      radius: 0.55,
      baseY: 0.7,
      spinPhase: Math.random() * Math.PI * 2,
      collected: false,
      isAnimatingPickup: false,
      pickupTimer: 0
    });
  }

  /* Spawn Sparkling Confetti / Item Burst */
  spawnSparkles(x, y, z, count = 8, color = 0xfde047) {
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(this.geoParticle, new THREE.MeshBasicMaterial({ color: color }));
      p.position.set(x, y, z);
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        2.0 + Math.random() * 3.0,
        Math.sin(angle) * speed
      );

      this.scene.add(p);
      this.particles.push({ mesh: p, vel: vel, life: 0.6, maxLife: 0.6 });
    }
  }

  /* Frame Update & Player Item Collisions */
  update(delta, player, onKeyCollected, onCoinCollected) {
    const pPos = player.position;

    // 1. Update Magic Key
    if (this.keyItem && !this.keyItem.collected) {
      // Bob and spin
      this.keyItem.group.rotation.y += delta * 2.2;
      this.keyItem.group.position.y = this.keyItem.baseY + Math.sin(Date.now() * 0.003) * 0.12;

      // Player pickup check
      const dx = pPos.x - this.keyItem.x;
      const dz = pPos.z - this.keyItem.z;
      if (dx * dx + dz * dz < (this.keyItem.radius + player.radius) * (this.keyItem.radius + player.radius)) {
        this.keyItem.collected = true;
        this.hasKey = true;
        this.group.remove(this.keyItem.group);

        // Sound & Sparkles
        if (window.audioManager) {
          window.audioManager.playKey();
        }
        this.spawnSparkles(this.keyItem.x, 1.2, this.keyItem.z, 16, 0xfbbf24);

        if (onKeyCollected) {
          onKeyCollected();
        }
      }
    }

    // 2. Update Gold Coins
    this.coins.forEach(coin => {
      if (coin.collected) return;

      if (coin.isAnimatingPickup) {
        // Upward pop animation
        coin.pickupTimer += delta * 4.0;
        coin.group.position.y += delta * 3.0;
        coin.group.scale.multiplyScalar(0.9);
        coin.coinMesh.rotation.y += delta * 15.0;

        if (coin.pickupTimer >= 0.4) {
          coin.collected = true;
          this.group.remove(coin.group);
        }
        return;
      }

      // Idle spin and bob
      coin.coinMesh.rotation.y += delta * 3.0;
      coin.group.position.y = coin.baseY + Math.sin(Date.now() * 0.004 + coin.spinPhase) * 0.08;

      // Player collision check
      const dx = pPos.x - coin.x;
      const dz = pPos.z - coin.z;
      if (dx * dx + dz * dz < (coin.radius + player.radius) * (coin.radius + player.radius)) {
        coin.isAnimatingPickup = true;
        this.collectedLevelCoins++;

        // Add persistent coins to storage
        let totalBank = 0;
        try {
          totalBank = parseInt(localStorage.getItem('maze_bank_coins') || '0', 10);
          totalBank++;
          localStorage.setItem('maze_bank_coins', totalBank);
        } catch (e) {
          totalBank++;
        }

        // Audio & Sparkles
        if (window.audioManager) {
          window.audioManager.playCoin();
        }
        this.spawnSparkles(coin.x, coin.group.position.y, coin.z, 6, 0xf59e0b);

        if (onCoinCollected) {
          onCoinCollected(totalBank, this.collectedLevelCoins, this.totalLevelCoins);
        }
      }
    });

    // 3. Update Sparkle Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      p.vel.y -= 9.8 * delta; // gravity
      p.mesh.position.addScaledVector(p.vel, delta);
      const scale = Math.max(0.01, p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }
}

