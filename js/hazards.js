/* ========================================================
   3D MAZE ADVENTURE - HAZARDS & CHECKPOINTS
   Retractable Spikes, Fire Vents, Patrolling Sentries,
   and Glowing Checkpoint Beacons with clear telegraphs
   ======================================================== */

class HazardManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.spikes = [];
    this.fireVents = [];
    this.sentries = [];
    this.checkpoints = [];

    // Pre-create shared geometries and materials
    this.initAssets();
  }

  initAssets() {
    // Spike plate & spike cone
    this.geoSpikePlate = new THREE.BoxGeometry(1.4, 0.1, 1.4);
    this.matPlate = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.8 });
    this.geoSpikeCone = new THREE.ConeGeometry(0.12, 0.9, 6);
    this.matSpike = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.9 });

    // Fire vent grate
    this.geoGrate = new THREE.CylinderGeometry(0.7, 0.75, 0.12, 16);
    this.matGrate = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.6 });
    this.geoFlame = new THREE.ConeGeometry(0.5, 1.8, 8);
    this.matFlame = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.85 });

    // Sentry drone
    this.geoSentryBody = new THREE.SphereGeometry(0.35, 16, 16);
    this.matSentryBody = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.9 });
    this.geoSentryCore = new THREE.SphereGeometry(0.18, 12, 12);
    this.matSentryCore = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.geoSentryRing = new THREE.TorusGeometry(0.48, 0.04, 8, 24);
    this.matSentryRing = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 });

    // Checkpoint Crystal
    this.geoCrystal = new THREE.OctahedronGeometry(0.38, 0);
    this.matCrystalInactive = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.5
    });
    this.matCrystalActive = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.0,
      roughness: 0.1,
      metalness: 0.8
    });
  }

  /* Clear all hazards from scene */
  clear() {
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.spikes = [];
    this.fireVents = [];
    this.sentries = [];
    this.checkpoints = [];
  }

  /* Spawn hazards and checkpoints from level data */
  populate(mazeManager) {
    this.clear();

    // Spawn Checkpoints
    mazeManager.checkpoints.forEach(pos => {
      this.addCheckpoint(pos.x, pos.z);
    });

    // Spawn Hazards
    mazeManager.hazardSpots.forEach((spot, index) => {
      if (spot.type === 'spike') {
        this.addSpike(spot.x, spot.z, index * 0.4);
      } else if (spot.type === 'fire') {
        this.addFireVent(spot.x, spot.z, index * 0.6);
      } else if (spot.type === 'sentry') {
        this.addSentry(spot.x, spot.z);
      }
    });
  }

  /* 1. RETRACTABLE SPIKE TRAP */
  addSpike(x, z, timeOffset = 0) {
    const spikeGroup = new THREE.Group();
    spikeGroup.position.set(x, 0, z);

    // Floor plate
    const plate = new THREE.Mesh(this.geoSpikePlate, this.matPlate);
    plate.position.y = 0.05;
    plate.receiveShadow = true;
    spikeGroup.add(plate);

    // 4 spikes
    const spikesSubGroup = new THREE.Group();
    const offsets = [
      { x: -0.35, z: -0.35 },
      { x: 0.35, z: -0.35 },
      { x: -0.35, z: 0.35 },
      { x: 0.35, z: 0.35 }
    ];

    offsets.forEach(off => {
      const spike = new THREE.Mesh(this.geoSpikeCone, this.matSpike);
      spike.position.set(off.x, 0.45, off.z);
      spike.castShadow = true;
      spikesSubGroup.add(spike);
    });

    spikesSubGroup.position.y = -0.9; // Initially retracted
    spikeGroup.add(spikesSubGroup);

    this.group.add(spikeGroup);

    this.spikes.push({
      group: spikeGroup,
      spikesMesh: spikesSubGroup,
      x: x,
      z: z,
      radius: 0.75,
      timer: timeOffset,
      cycleDuration: 3.2, // seconds per full cycle
      isLethal: false
    });
  }

  /* 2. FIRE VENT HAZARD */
  addFireVent(x, z, timeOffset = 0) {
    const ventGroup = new THREE.Group();
    ventGroup.position.set(x, 0, z);

    // Floor Grate
    const grate = new THREE.Mesh(this.geoGrate, this.matGrate);
    grate.position.y = 0.06;
    grate.receiveShadow = true;
    ventGroup.add(grate);

    // Flame Column
    const flame = new THREE.Mesh(this.geoFlame, this.matFlame.clone());
    flame.position.y = 0.9;
    flame.scale.set(0.01, 0.01, 0.01);
    ventGroup.add(flame);

    // Fire Light
    const fireLight = new THREE.PointLight(0xff6600, 0, 5.0);
    fireLight.position.y = 0.8;
    ventGroup.add(fireLight);

    this.group.add(ventGroup);

    this.fireVents.push({
      group: ventGroup,
      flameMesh: flame,
      light: fireLight,
      x: x,
      z: z,
      radius: 0.7,
      timer: timeOffset,
      cycleDuration: 4.0,
      isLethal: false
    });
  }

  /* 3. PATROLLING SENTRY DRONE */
  addSentry(x, z) {
    const sentryGroup = new THREE.Group();
    sentryGroup.position.set(x, 1.2, z);

    // Body
    const body = new THREE.Mesh(this.geoSentryBody, this.matSentryBody);
    body.castShadow = true;
    sentryGroup.add(body);

    // Glowing Core
    const core = new THREE.Mesh(this.geoSentryCore, this.matSentryCore);
    sentryGroup.add(core);

    // Rotating Outer Ring
    const ring = new THREE.Mesh(this.geoSentryRing, this.matSentryRing);
    sentryGroup.add(ring);

    // Red Searchlight Spot on Floor
    const spotGeo = new THREE.CircleGeometry(0.8, 16);
    spotGeo.rotateX(-Math.PI / 2);
    const spotMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.35 });
    const spot = new THREE.Mesh(spotGeo, spotMat);
    spot.position.y = -1.18;
    sentryGroup.add(spot);

    this.group.add(sentryGroup);

    this.sentries.push({
      group: sentryGroup,
      ring: ring,
      baseX: x,
      baseZ: z,
      currentX: x,
      currentZ: z,
      radius: 0.8,
      speed: 1.8,
      range: 2.2, // Patrol distance
      angle: Math.random() * Math.PI * 2
    });
  }

  /* 4. GLOWING CHECKPOINT BEACON */
  addCheckpoint(x, z) {
    const cpGroup = new THREE.Group();
    cpGroup.position.set(x, 0, z);

    // Pedestal
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.25, 8), this.matPlate);
    base.position.y = 0.12;
    cpGroup.add(base);

    // Floating Crystal
    const crystal = new THREE.Mesh(this.geoCrystal, this.matCrystalInactive.clone());
    crystal.position.y = 1.0;
    crystal.castShadow = true;
    cpGroup.add(crystal);

    // Glow Light
    const light = new THREE.PointLight(0x0284c7, 0.6, 4.0);
    light.position.y = 1.2;
    cpGroup.add(light);

    this.group.add(cpGroup);

    this.checkpoints.push({
      group: cpGroup,
      crystal: crystal,
      light: light,
      x: x,
      z: z,
      radius: 1.0,
      activated: false
    });
  }

  /* Frame Update & Player Hazard Collisions */
  update(delta, player, onCheckpointReached) {
    const pPos = player.position;

    // 1. Update Spikes
    this.spikes.forEach(spike => {
      spike.timer = (spike.timer + delta) % spike.cycleDuration;
      const t = spike.timer;

      // Cycle phases:
      // 0.0 - 1.2s: Safe (submerged at y = -0.9)
      // 1.2 - 1.8s: Warning telegraph (rattles at y = -0.5)
      // 1.8 - 2.8s: Lethal Active (thrusts to y = 0)
      // 2.8 - 3.2s: Retracting back to -0.9
      if (t < 1.2) {
        spike.spikesMesh.position.y = -0.9;
        spike.isLethal = false;
      } else if (t < 1.8) {
        spike.spikesMesh.position.y = -0.5 + Math.sin(t * 40) * 0.04;
        spike.isLethal = false;
      } else if (t < 2.8) {
        spike.spikesMesh.position.y = 0;
        spike.isLethal = true;
      } else {
        const retProg = (t - 2.8) / 0.4;
        spike.spikesMesh.position.y = -retProg * 0.9;
        spike.isLethal = false;
      }

      // Check collision with player if lethal and player is grounded
      if (spike.isLethal && player.isGrounded && !player.isDead) {
        const dx = pPos.x - spike.x;
        const dz = pPos.z - spike.z;
        if (dx * dx + dz * dz < (spike.radius + player.radius) * (spike.radius + player.radius)) {
          player.die();
        }
      }
    });

    // 2. Update Fire Vents
    this.fireVents.forEach(vent => {
      vent.timer = (vent.timer + delta) % vent.cycleDuration;
      const t = vent.timer;

      // Phases:
      // 0.0 - 2.0s: Dormant
      // 2.0 - 2.6s: Telegraphing warning (vent glows orange)
      // 2.6 - 3.6s: Flaming blast (lethal)
      // 3.6 - 4.0s: Dissipating
      if (t < 2.0) {
        vent.flameMesh.scale.set(0.01, 0.01, 0.01);
        vent.light.intensity = 0;
        vent.isLethal = false;
      } else if (t < 2.6) {
        vent.light.intensity = 0.5;
        vent.flameMesh.scale.set(0.2, 0.2, 0.2);
        vent.isLethal = false;
      } else if (t < 3.6) {
        vent.flameMesh.scale.set(1.0, 1.0 + Math.sin(t * 20) * 0.15, 1.0);
        vent.light.intensity = 2.5;
        vent.isLethal = true;
      } else {
        const fade = (4.0 - t) / 0.4;
        vent.flameMesh.scale.set(fade, fade, fade);
        vent.light.intensity = fade * 1.5;
        vent.isLethal = false;
      }

      // Player collision
      if (vent.isLethal && player.isGrounded && !player.isDead) {
        const dx = pPos.x - vent.x;
        const dz = pPos.z - vent.z;
        if (dx * dx + dz * dz < (vent.radius + player.radius) * (vent.radius + player.radius)) {
          player.die();
        }
      }
    });

    // 3. Update Patrolling Sentries
    this.sentries.forEach(sentry => {
      sentry.angle += delta * sentry.speed;
      sentry.ring.rotation.x += delta * 3.0;
      sentry.ring.rotation.y += delta * 2.0;

      // Ping-pong patrol along corridor
      sentry.currentX = sentry.baseX + Math.sin(sentry.angle) * sentry.range;
      sentry.group.position.x = sentry.currentX;
      sentry.group.position.y = 1.2 + Math.sin(sentry.angle * 2) * 0.15; // Hover bobbing

      // Player collision
      if (!player.isDead) {
        const dx = pPos.x - sentry.currentX;
        const dz = pPos.z - sentry.baseZ;
        if (dx * dx + dz * dz < (sentry.radius + player.radius) * (sentry.radius + player.radius)) {
          player.die();
        }
      }
    });

    // 4. Update Checkpoints
    this.checkpoints.forEach(cp => {
      cp.crystal.rotation.y += delta * 1.2;
      cp.crystal.position.y = 1.0 + Math.sin(Date.now() * 0.003) * 0.1;

      if (!cp.activated && !player.isDead) {
        const dx = pPos.x - cp.x;
        const dz = pPos.z - cp.z;
        if (dx * dx + dz * dz < (cp.radius + player.radius) * (cp.radius + player.radius)) {
          cp.activated = true;
          cp.crystal.material = this.matCrystalActive;
          cp.light.color.setHex(0x38bdf8);
          cp.light.intensity = 2.0;

          // Update player spawn
          player.spawnPoint.set(cp.x, 0, cp.z);

          if (window.audioManager) {
            window.audioManager.playCheckpoint();
          }

          if (onCheckpointReached) {
            onCheckpointReached();
          }
        }
      }
    });
  }
}

