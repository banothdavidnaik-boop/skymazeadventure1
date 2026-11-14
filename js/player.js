/* ========================================================
   3D MAZE ADVENTURE - PLAYER CHARACTER & RIG
   Procedural 3D animated character supporting 6 Avatars
   & 4 Costumes with smooth physics and collisions
   ======================================================== */

class PlayerCharacter {
  constructor(scene) {
    this.scene = scene;

    // Movement physics
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.targetRotation = 0;
    this.currentRotation = 0;
    this.speed = 8.5; // units per second
    this.sprintMultiplier = 1.35;
    this.isSprinting = false;
    this.jumpVelocity = 0;
    this.gravity = 30.0;
    this.isGrounded = true;
    this.radius = 0.42; // collision radius

    // Respawn position
    this.spawnPoint = new THREE.Vector3(0, 0, 0);
    this.isDead = false;
    this.isCheering = false;
    this.invulnerableTimer = 0;

    // Animation timers
    this.walkCycle = 0;
    this.footstepTimer = 0;
    this.squash = 1.0;

    // Active Avatar & Costume
    let av = 'astro', cs = 'classic';
    try {
      av = localStorage.getItem('maze_equipped_avatar') || 'astro';
      cs = localStorage.getItem('maze_equipped_costume') || 'classic';
    } catch (e) {}
    this.avatarId = av;
    this.costumeId = cs;

    // Build the 3D hierarchy
    this.group = new THREE.Group();
    this.tiltGroup = new THREE.Group();
    this.group.add(this.tiltGroup);
    this.scene.add(this.group);

    // Build the character mesh
    this.buildMesh();
  }

  // Costumes Color Palettes
  static getCostumeColors(costumeId) {
    const palettes = {
      classic: {
        primary: 0x0284c7, // Sky Blue
        secondary: 0x38bdf8,
        accent: 0xf59e0b, // Gold
        trim: 0x1e293b,
        visor: 0x38bdf8,
        metal: 0x94a3b8
      },
      cyberpunk: {
        primary: 0x0f172a, // Deep Navy
        secondary: 0x06b6d4, // Neon Cyan
        accent: 0xf43f5e, // Hot Pink
        trim: 0x111827,
        visor: 0x22d3ee,
        metal: 0x64748b
      },
      gold: {
        primary: 0xd97706, // Rich Gold
        secondary: 0xfbbf24, // Bright Gold
        accent: 0xb91c1c, // Crimson
        trim: 0x451a03,
        visor: 0xfef08a,
        metal: 0xfef08a
      },
      shadow: {
        primary: 0x1e1b4b, // Midnight Indigo
        secondary: 0x7c3aed, // Electric Violet
        accent: 0xa855f7, // Neon Purple
        trim: 0x09090b,
        visor: 0xc084fc,
        metal: 0x312e81
      },
      emerald: {
        primary: 0x065f46, // Deep Jade
        secondary: 0x10b981, // Emerald Green
        accent: 0xa3e635, // Neon Lime
        trim: 0x022c22,
        visor: 0x34d399,
        metal: 0x6ee7b7
      },
      crimson: {
        primary: 0x1c1917, // Basalt Obsidian
        secondary: 0xe11d48, // Crimson Red
        accent: 0xf97316, // Molten Flame
        trim: 0x450a0a,
        visor: 0xfacc15,
        metal: 0x78716c
      },
      arctic: {
        primary: 0x0369a1, // Glacial Deep Blue
        secondary: 0x38bdf8, // Ice Cyan
        accent: 0xf8fafc, // Snow White
        trim: 0x082f49,
        visor: 0x67e8f9,
        metal: 0xe2e8f0
      },
      vaporwave: {
        primary: 0x6b21a8, // Dream Purple
        secondary: 0xf472b6, // Bubblegum Pink
        accent: 0x2dd4bf, // Mint Foam
        trim: 0x3b0764,
        visor: 0x38bdf8,
        metal: 0xfbcfe8
      }
    };
    return palettes[costumeId] || palettes.classic;
  }

  buildMesh() {
    // Clear existing parts
    while (this.tiltGroup.children.length > 0) {
      this.tiltGroup.remove(this.tiltGroup.children[0]);
    }

    const colors = PlayerCharacter.getCostumeColors(this.costumeId);

    // Standard materials
    const matPrimary = new THREE.MeshStandardMaterial({ color: colors.primary, roughness: 0.4, metalness: 0.1 });
    const matSecondary = new THREE.MeshStandardMaterial({ color: colors.secondary, roughness: 0.3, metalness: 0.2 });
    const matAccent = new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.2, metalness: 0.3 });
    const matTrim = new THREE.MeshStandardMaterial({ color: colors.trim, roughness: 0.6, metalness: 0.1 });
    const matVisor = new THREE.MeshStandardMaterial({ color: colors.visor, roughness: 0.1, metalness: 0.8, emissive: colors.visor, emissiveIntensity: 0.3 });
    const matMetal = new THREE.MeshStandardMaterial({ color: colors.metal, roughness: 0.3, metalness: 0.8 });
    const matSkin = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });

    // Base body nodes
    this.torso = new THREE.Group();
    this.head = new THREE.Group();
    this.leftArm = new THREE.Group();
    this.rightArm = new THREE.Group();
    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();

    // Position pivots
    this.torso.position.y = 0.55;
    this.head.position.y = 0.5; // relative to torso
    this.leftArm.position.set(-0.35, 0.35, 0);
    this.rightArm.position.set(0.35, 0.35, 0);
    this.leftLeg.position.set(-0.16, -0.15, 0);
    this.rightLeg.position.set(0.16, -0.15, 0);

    this.torso.add(this.head);
    this.torso.add(this.leftArm);
    this.torso.add(this.rightArm);
    this.torso.add(this.leftLeg);
    this.torso.add(this.rightLeg);
    this.tiltGroup.add(this.torso);

    // Build specific avatar geometry
    switch (this.avatarId) {
      case 'robot':
        this.buildRobotAvatar(matPrimary, matSecondary, matAccent, matTrim, matVisor, matMetal);
        break;
      case 'ninja':
        this.buildNinjaAvatar(matPrimary, matSecondary, matAccent, matTrim, matVisor, matSkin);
        break;
      case 'mage':
        this.buildMageAvatar(matPrimary, matSecondary, matAccent, matTrim, matVisor, matSkin);
        break;
      case 'knight':
        this.buildKnightAvatar(matPrimary, matSecondary, matAccent, matTrim, matVisor, matMetal);
        break;
      case 'fox':
        this.buildFoxAvatar(matPrimary, matSecondary, matAccent, matTrim, matVisor);
        break;
      case 'dragon':
        this.buildDragonAvatar(matPrimary, matSecondary, matAccent, matTrim, matVisor, matMetal);
        break;
      case 'samurai':
        this.buildSamuraiAvatar(matPrimary, matSecondary, matAccent, matTrim, matVisor, matMetal);
        break;
      case 'ranger':
        this.buildRangerAvatar(matPrimary, matSecondary, matAccent, matTrim, matVisor, matMetal);
        break;
      case 'monarch':
        this.buildMonarchAvatar(matPrimary, matSecondary, matAccent, matTrim, matVisor, matMetal);
        break;
      case 'astro':
      default:
        this.buildAstroAvatar(matPrimary, matSecondary, matAccent, matTrim, matVisor, matMetal);
        break;
    }

    // Shadow blob / Ground indicator
    const shadowGeo = new THREE.CircleGeometry(0.38, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.02;
    this.group.add(this.shadowMesh);

    // Glowing Silhouette Highlight Ring (for high visibility behind sky-blue walls)
    const haloGeo = new THREE.RingGeometry(0.40, 0.45, 24);
    const haloMat = new THREE.MeshBasicMaterial({ color: colors.secondary, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.haloMesh.rotation.x = -Math.PI / 2;
    this.haloMesh.position.y = 0.03;
    this.group.add(this.haloMesh);

    // Enable shadows on all character meshes
    this.group.traverse(child => {
      if (child.isMesh && child !== this.shadowMesh && child !== this.haloMesh) {
        child.castShadow = true;
        child.receiveShadow = false;
      }
    });
  }

  /* 1. ASTRO SCOUT (Default Adventurer) */
  buildAstroAvatar(mPrimary, mSecondary, mAccent, mTrim, mVisor, mMetal) {
    // Torso: Padded astronaut suit
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.45, 0.32), mPrimary);
    this.torso.add(torsoMesh);

    // Chest badge
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.05), mAccent);
    badge.position.set(0, 0.08, 0.16);
    this.torso.add(badge);

    // Oxygen backpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.18), mSecondary);
    pack.position.set(0, 0.04, -0.22);
    this.torso.add(pack);

    // Head: Helmet with curved bubble visor
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), mPrimary);
    this.head.add(helm);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), mVisor);
    visor.rotation.x = Math.PI / 2;
    visor.position.set(0, 0, 0.06);
    this.head.add(visor);

    // Limbs
    this.addStandardLimbs(mSecondary, mTrim, mTrim);
  }

  /* 2. MECHA BOT */
  buildRobotAvatar(mPrimary, mSecondary, mAccent, mTrim, mVisor, mMetal) {
    // Boxy robotic torso
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.34), mMetal);
    this.torso.add(torsoMesh);

    // Center power core
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16), mAccent);
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0.05, 0.16);
    this.torso.add(core);

    // Head: monitor cube with LED face
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.36), mPrimary);
    this.head.add(headMesh);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.24), mVisor);
    screen.position.set(0, 0, 0.185);
    this.head.add(screen);

    // Antenna on head
    const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16), mMetal);
    antennaStem.position.set(0, 0.25, 0);
    const antennaBall = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mAccent);
    antennaBall.position.set(0, 0.34, 0);
    this.head.add(antennaStem);
    this.head.add(antennaBall);

    // Robot limbs
    this.addStandardLimbs(mMetal, mSecondary, mTrim);
  }

  /* 3. CYBER NINJA */
  buildNinjaAvatar(mPrimary, mSecondary, mAccent, mTrim, mVisor, mSkin) {
    // Sleek gi
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.28), mPrimary);
    this.torso.add(torsoMesh);

    // Belt / Sash
    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.3), mAccent);
    sash.position.set(0, -0.15, 0);
    this.torso.add(sash);

    // Head with ninja cowl & glowing eyes slit
    const cowl = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), mPrimary);
    this.head.add(cowl);
    const eyeBand = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.08), mVisor);
    eyeBand.position.set(0, 0.02, 0.21);
    this.head.add(eyeBand);

    // Back katana
    const scabbard = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7), mTrim);
    scabbard.rotation.z = Math.PI / 4;
    scabbard.position.set(0, 0.1, -0.18);
    this.torso.add(scabbard);

    this.addStandardLimbs(mPrimary, mTrim, mSecondary);
  }

  /* 4. MYSTIC MAGE */
  buildMageAvatar(mPrimary, mSecondary, mAccent, mTrim, mVisor, mSkin) {
    // Robe
    const torsoMesh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 12), mPrimary);
    torsoMesh.rotation.x = Math.PI;
    this.torso.add(torsoMesh);

    // Wizard Head & Hat
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), mSkin);
    this.head.add(headMesh);

    // Hat brim & cone
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16), mPrimary);
    brim.position.y = 0.16;
    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 12), mSecondary);
    hatCone.position.set(0, 0.45, -0.05);
    hatCone.rotation.x = -0.15;
    this.head.add(brim);
    this.head.add(hatCone);

    // Floating mana orb
    this.manaOrb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), mVisor);
    this.manaOrb.position.set(0.45, 0.35, 0.1);
    this.torso.add(this.manaOrb);

    this.addStandardLimbs(mPrimary, mSecondary, mTrim);
  }

  /* 5. ROYAL KNIGHT */
  buildKnightAvatar(mPrimary, mSecondary, mAccent, mTrim, mVisor, mMetal) {
    // Armor torso
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.32), mMetal);
    this.torso.add(torsoMesh);

    // Heraldic crest
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.04), mAccent);
    crest.position.set(0, 0.05, 0.17);
    this.torso.add(crest);

    // Knight Greathelm
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.34, 12), mMetal);
    this.head.add(helm);
    const plume = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.3), mPrimary);
    plume.position.set(0, 0.22, 0);
    this.head.add(plume);

    // T-visor slot
    const visorT = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.05), mTrim);
    visorT.position.set(0, 0.04, 0.21);
    this.head.add(visorT);

    this.addStandardLimbs(mMetal, mTrim, mSecondary);
  }

  /* 6. COSMIC FOX */
  buildFoxAvatar(mPrimary, mSecondary, mAccent, mTrim, mVisor) {
    // Fur torso
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.3), mPrimary);
    this.torso.add(torsoMesh);

    // White chest belly
    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.04), mSecondary);
    belly.position.set(0, -0.05, 0.14);
    this.torso.add(belly);

    // Fox Head with snout and ears
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16), mPrimary);
    this.head.add(headMesh);

    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 8), mSecondary);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.05, 0.24);
    this.head.add(snout);

    // Pointy Fox Ears
    const earGeo = new THREE.ConeGeometry(0.1, 0.22, 4);
    const leftEar = new THREE.Mesh(earGeo, mPrimary);
    leftEar.position.set(-0.16, 0.25, 0);
    leftEar.rotation.z = 0.2;
    const rightEar = new THREE.Mesh(earGeo, mPrimary);
    rightEar.position.set(0.16, 0.25, 0);
    rightEar.rotation.z = -0.2;
    this.head.add(leftEar);
    this.head.add(rightEar);

    // Animated Fluffy Tail
    this.tail = new THREE.Group();
    const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 8), mPrimary);
    tailMesh.position.set(0, 0.15, -0.15);
    tailMesh.rotation.x = -Math.PI / 3;
    this.tail.add(tailMesh);
    this.tail.position.set(0, -0.12, -0.14);
    this.torso.add(this.tail);

    this.addStandardLimbs(mPrimary, mSecondary, mTrim);
  }

  /* 7. PYRO DRAKE (Dragon Warrior) */
  buildDragonAvatar(mPrimary, mSecondary, mAccent, mTrim, mVisor, mMetal) {
    // Scaled Torso
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.46, 0.32), mPrimary);
    this.torso.add(torsoMesh);

    // Golden Dragon Chest Scales
    const chestPlates = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.06), mAccent);
    chestPlates.position.set(0, 0.02, 0.16);
    this.torso.add(chestPlates);

    // Dragon Head with Snout
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.34), mPrimary);
    this.head.add(headMesh);

    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 6), mSecondary);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.06, 0.26);
    this.head.add(snout);

    // Curved Dragon Horns
    const hornGeo = new THREE.ConeGeometry(0.08, 0.28, 6);
    const leftHorn = new THREE.Mesh(hornGeo, mAccent);
    leftHorn.position.set(-0.16, 0.24, -0.05);
    leftHorn.rotation.set(-0.3, 0, -0.35);
    const rightHorn = new THREE.Mesh(hornGeo, mAccent);
    rightHorn.position.set(0.16, 0.24, -0.05);
    rightHorn.rotation.set(-0.3, 0, 0.35);
    this.head.add(leftHorn);
    this.head.add(rightHorn);

    // Glowing Dragon Eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.05, 0.04);
    const leftEye = new THREE.Mesh(eyeGeo, mVisor);
    leftEye.position.set(-0.11, 0.04, 0.17);
    const rightEye = new THREE.Mesh(eyeGeo, mVisor);
    rightEye.position.set(0.11, 0.04, 0.17);
    this.head.add(leftEye);
    this.head.add(rightEye);

    // Dragon Tail
    this.tail = new THREE.Group();
    const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 6), mPrimary);
    tailMesh.position.set(0, 0.2, -0.2);
    tailMesh.rotation.x = -Math.PI / 2.8;
    this.tail.add(tailMesh);
    this.tail.position.set(0, -0.15, -0.14);
    this.torso.add(this.tail);

    this.addStandardLimbs(mPrimary, mSecondary, mTrim);
  }

  /* 8. CYBER SAMUR-AI */
  buildSamuraiAvatar(mPrimary, mSecondary, mAccent, mTrim, mVisor, mMetal) {
    // Lacquered Samurai Armor Torso
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.32), mPrimary);
    this.torso.add(torsoMesh);

    // Armor Obi Sash & Crest
    const obi = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.34), mAccent);
    obi.position.set(0, -0.14, 0);
    this.torso.add(obi);

    // Kabuto Helmet
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), mTrim);
    this.head.add(helm);

    // Golden Kabuto Crest (Maedate Horns)
    const crest = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16, Math.PI), mAccent);
    crest.rotation.z = Math.PI;
    crest.position.set(0, 0.18, 0.16);
    this.head.add(crest);

    // Visor / Cyber Faceplate
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.1), mVisor);
    visor.position.set(0, 0.02, 0.2);
    this.head.add(visor);

    // Shoulder Armor Guards (O-Sode)
    const sodeGeo = new THREE.BoxGeometry(0.12, 0.22, 0.2);
    const leftSode = new THREE.Mesh(sodeGeo, mSecondary);
    leftSode.position.set(-0.28, 0.15, 0);
    leftSode.rotation.z = -0.2;
    this.torso.add(leftSode);

    const rightSode = new THREE.Mesh(sodeGeo, mSecondary);
    rightSode.position.set(0.28, 0.15, 0);
    rightSode.rotation.z = 0.2;
    this.torso.add(rightSode);

    this.addStandardLimbs(mPrimary, mTrim, mMetal);
  }

  /* 9. SPACE RANGER */
  buildRangerAvatar(mPrimary, mSecondary, mAccent, mTrim, mVisor, mMetal) {
    // Tactical Combat Exosuit
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.45, 0.3), mPrimary);
    this.torso.add(torsoMesh);

    // Utility Chest Harness
    const harness = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.06), mSecondary);
    harness.position.set(0, 0.06, 0.16);
    this.torso.add(harness);

    // Tactical Jump Thrusters
    const jetL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35, 8), mMetal);
    jetL.position.set(-0.16, 0.05, -0.2);
    const jetR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35, 8), mMetal);
    jetR.position.set(0.16, 0.05, -0.2);
    this.torso.add(jetL);
    this.torso.add(jetR);

    // Tactical Helmet with Comms Antenna
    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.36), mPrimary);
    this.head.add(helm);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.08), mVisor);
    visor.position.set(0, 0.02, 0.19);
    this.head.add(visor);

    // Comms Antenna
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), mAccent);
    antenna.position.set(-0.2, 0.18, 0);
    antenna.rotation.z = -0.15;
    this.head.add(antenna);

    this.addStandardLimbs(mSecondary, mTrim, mMetal);
  }

  /* 10. CELESTIAL MONARCH */
  buildMonarchAvatar(mPrimary, mSecondary, mAccent, mTrim, mVisor, mMetal) {
    // Regal Royal Robe
    const torsoMesh = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.52, 12), mPrimary);
    torsoMesh.rotation.x = Math.PI;
    this.torso.add(torsoMesh);

    // Royal Ermine Collar Mantle
    const mantle = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.12, 12), mSecondary);
    mantle.position.set(0, 0.22, 0);
    this.torso.add(mantle);

    // Monarch Head
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), mVisor);
    this.head.add(headMesh);

    // Shimmering Golden Crown
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.08, 8), mAccent);
    crownBase.position.y = 0.22;
    this.head.add(crownBase);

    // 4 Crown Spikes
    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 4), mAccent);
      const a = (i * Math.PI) / 2;
      spike.position.set(Math.cos(a) * 0.18, 0.32, Math.sin(a) * 0.18);
      this.head.add(spike);
    }

    // Floating Royal Scepter Jewel
    this.manaOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), mAccent);
    this.manaOrb.position.set(0.44, 0.38, 0.1);
    this.torso.add(this.manaOrb);

    this.addStandardLimbs(mPrimary, mSecondary, mTrim);
  }

  addStandardLimbs(mArm, mLeg, mFoot) {
    // Left Arm
    const armGeo = new THREE.BoxGeometry(0.14, 0.36, 0.14);
    const lArmMesh = new THREE.Mesh(armGeo, mArm);
    lArmMesh.position.y = -0.18;
    this.leftArm.add(lArmMesh);

    // Right Arm
    const rArmMesh = new THREE.Mesh(armGeo, mArm);
    rArmMesh.position.y = -0.18;
    this.rightArm.add(rArmMesh);

    // Left Leg & Boot
    const legGeo = new THREE.BoxGeometry(0.16, 0.32, 0.16);
    const lLegMesh = new THREE.Mesh(legGeo, mLeg);
    lLegMesh.position.y = -0.16;
    this.leftLeg.add(lLegMesh);
    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.22), mFoot);
    lBoot.position.set(0, -0.28, 0.03);
    this.leftLeg.add(lBoot);

    // Right Leg & Boot
    const rLegMesh = new THREE.Mesh(legGeo, mLeg);
    rLegMesh.position.y = -0.16;
    this.rightLeg.add(rLegMesh);
    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.22), mFoot);
    rBoot.position.set(0, -0.28, 0.03);
    this.rightLeg.add(rBoot);
  }

  setAvatarAndCostume(avatarId, costumeId) {
    this.avatarId = avatarId;
    this.costumeId = costumeId;
    try {
      localStorage.setItem('maze_equipped_avatar', avatarId);
      localStorage.setItem('maze_equipped_costume', costumeId);
    } catch (e) {}
    this.buildMesh();
  }

  setSpawn(x, z) {
    this.spawnPoint.set(x, 0, z);
    this.respawn();
  }

  respawn() {
    this.position.copy(this.spawnPoint);
    this.velocity.set(0, 0, 0);
    this.jumpVelocity = 0;
    this.isGrounded = true;
    this.isDead = false;
    this.isCheering = false;
    this.invulnerableTimer = 1.0;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.currentRotation;
    this.group.visible = true;
  }

  die() {
    if (this.isDead || this.invulnerableTimer > 0) return;
    this.isDead = true;
    if (window.audioManager) {
      window.audioManager.playHazard();
    }

    // Comical hurt spin and quick instant respawn
    let t = 0;
    const hurtInterval = setInterval(() => {
      t += 0.05;
      this.group.rotation.y += 0.4;
      this.group.position.y = Math.sin(t * 8) * 0.4;
      if (t >= 0.6) {
        clearInterval(hurtInterval);
        this.respawn();
      }
    }, 50);
  }

  triggerVictory() {
    this.isCheering = true;
    this.velocity.set(0, 0, 0);
  }

  jump() {
    if (this.isGrounded && !this.isDead && !this.isCheering) {
      this.jumpVelocity = 11.5;
      this.isGrounded = false;
      this.squash = 1.3;
      if (window.audioManager) {
        window.audioManager.playJump();
      }
    }
  }

  /* Physics update & Wall collisions */
  update(delta, inputDir, isSprinting, maze) {
    if (this.isDead) return;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      // Gentle blinking
      this.group.visible = Math.floor(this.invulnerableTimer * 10) % 2 === 0;
      if (this.invulnerableTimer <= 0) this.group.visible = true;
    }

    // Victory celebration state
    if (this.isCheering) {
      this.currentRotation += delta * 3.5;
      this.group.rotation.y = this.currentRotation;
      this.leftArm.rotation.x = -Math.PI * 0.9;
      this.rightArm.rotation.x = -Math.PI * 0.9;
      this.torso.position.y = 0.55 + Math.sin(Date.now() * 0.01) * 0.2;
      return;
    }

    // Horizontal Movement
    const currentSpeed = (isSprinting ? this.speed * this.sprintMultiplier : this.speed);
    const targetVelX = inputDir.x * currentSpeed;
    const targetVelZ = inputDir.z * currentSpeed;

    // Smooth acceleration / deceleration
    const accel = 18.0;
    this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1.0, accel * delta);
    this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1.0, accel * delta);

    // Proposed new position
    const moveX = this.velocity.x * delta;
    const moveZ = this.velocity.z * delta;

    // Wall Collision Resolution with smooth wall sliding
    if (maze) {
      this.resolveWallCollisions(moveX, moveZ, maze);
    } else {
      this.position.x += moveX;
      this.position.z += moveZ;
    }

    // Vertical Jump & Gravity
    if (!this.isGrounded) {
      this.jumpVelocity -= this.gravity * delta;
      this.position.y += this.jumpVelocity * delta;

      if (this.position.y <= 0) {
        this.position.y = 0;
        this.jumpVelocity = 0;
        this.isGrounded = true;
        this.squash = 0.75; // Landing squash
      }
    }

    // Smooth recovery of squash & stretch
    this.squash += (1.0 - this.squash) * Math.min(1.0, 15.0 * delta);

    // Rotation towards movement direction
    const movingSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    if (movingSpeed > 0.2) {
      this.targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
      // Smooth shortest-arc angle interpolation
      let diff = this.targetRotation - this.currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.currentRotation += diff * Math.min(1.0, 14.0 * delta);

      // Walk cycle animation
      this.walkCycle += delta * movingSpeed * 2.2;

      // Play footstep audio periodically
      this.footstepTimer += delta * movingSpeed;
      if (this.footstepTimer >= 3.2 && this.isGrounded) {
        this.footstepTimer = 0;
        if (window.audioManager) {
          window.audioManager.playFootstep();
        }
      }
    } else {
      // Return to idle slowly
      this.walkCycle += delta * 1.5;
    }

    // Apply animation transforms to limbs
    this.animateLimbs(movingSpeed);

    // Apply position & rotation to 3D group
    this.group.position.copy(this.position);
    this.group.rotation.y = this.currentRotation;

    // Scale group for squash & stretch
    this.tiltGroup.scale.set(1.0 / Math.sqrt(this.squash), this.squash, 1.0 / Math.sqrt(this.squash));
  }

  /* Natural procedural limb animation */
  animateLimbs(speed) {
    if (!this.isGrounded) {
      // In-air jump pose
      this.leftArm.rotation.x = -1.2;
      this.rightArm.rotation.x = -1.2;
      this.leftLeg.rotation.x = 0.6;
      this.rightLeg.rotation.x = -0.4;
      return;
    }

    if (speed > 0.2) {
      // Running / Walking
      const stride = Math.sin(this.walkCycle);
      this.leftLeg.rotation.x = stride * 0.75;
      this.rightLeg.rotation.x = -stride * 0.75;

      this.leftArm.rotation.x = -stride * 0.65;
      this.rightArm.rotation.x = stride * 0.65;

      // Torso bobbing and forward lean
      this.torso.position.y = 0.55 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.06;
      this.tiltGroup.rotation.x = 0.12; // Forward lean
    } else {
      // Idle breathing
      const breath = Math.sin(this.walkCycle * 2);
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = breath * 0.05;
      this.rightArm.rotation.x = -breath * 0.05;
      this.torso.position.y = 0.55 + breath * 0.02;
      this.tiltGroup.rotation.x = 0;
    }

    // Fox tail wag
    if (this.tail) {
      this.tail.rotation.y = Math.sin(this.walkCycle * 3) * 0.35;
    }

    // Mage mana orb orbit
    if (this.manaOrb) {
      this.manaOrb.position.x = Math.cos(this.walkCycle * 2) * 0.45;
      this.manaOrb.position.z = Math.sin(this.walkCycle * 2) * 0.45;
      this.manaOrb.position.y = 0.35 + Math.sin(this.walkCycle * 4) * 0.08;
    }
  }

  /* Smooth circle vs AABB maze wall collision */
  resolveWallCollisions(moveX, moveZ, maze) {
    // Test X movement first
    const nextX = this.position.x + moveX;
    if (!maze.checkCollision(nextX, this.position.z, this.radius)) {
      this.position.x = nextX;
    } else {
      this.velocity.x = 0; // stop against wall
    }

    // Test Z movement independently (enables smooth gliding along walls!)
    const nextZ = this.position.z + moveZ;
    if (!maze.checkCollision(this.position.x, nextZ, this.radius)) {
      this.position.z = nextZ;
    } else {
      this.velocity.z = 0;
    }
  }
}

