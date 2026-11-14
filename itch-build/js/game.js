/* ========================================================
   3D MAZE ADVENTURE - MAIN GAME ENGINE
   Camera controller, input management, state machine,
   HUD updates, minimap radar, and victory celebration
   ======================================================== */

class GameEngine {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('canvas3d');

    // Game state
    this.state = 'PLAYING'; // 'PLAYING', 'PAUSED', 'LEVEL_COMPLETE'
    this.currentLevelIndex = 1;
    this.levelTime = 0;
    this.levelTimerRunning = false;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Lighting
    this.dirLight = null;
    this.ambLight = null;

    // Subsystem Managers
    this.maze = null;
    this.player = null;
    this.hazards = null;
    this.items = null;
    this.shop = null;

    // Camera parameters
    this.cameraOffset = new THREE.Vector3(0, 4.8, 5.5);
    this.cameraRotationAngle = 0;
    this.cameraTargetAngle = 0;
    this.cameraPitch = 0.62; // ~35 degrees down
    this.cameraTargetPitch = 0.62;
    this.cameraDistance = 6.2;
    this.isDraggingCamera = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;

    // Wall transparency raycaster
    this.raycaster = new THREE.Raycaster();
    this.transparentWalls = new Set();

    // Inputs
    this.keys = {};
    this.joystickDir = new THREE.Vector2(0, 0);
    this.touchStartPos = null;

    // Minimap
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    // Confetti system
    this.confettiCanvas = document.getElementById('confetti-canvas');
    this.confettiCtx = this.confettiCanvas ? this.confettiCanvas.getContext('2d') : null;
    this.confettiParticles = [];

    // Initialize Everything
    this.initThree();
    this.initSubsystems();
    this.setupEvents();
    this.setupUI();
    this.loadLevel(1);

    // Start Main Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  /* Three.js Scene, Camera, and Renderer setup */
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1325);
    this.scene.fog = new THREE.FogExp2(0x0b1325, 0.025);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 100);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Bright, inviting lighting with clear shadows
    this.ambLight = new THREE.AmbientLight(0xdbeafe, 0.75); // Soft daylight sky
    this.scene.add(this.ambLight);

    // Warm Sun Directional Light
    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.3);
    this.dirLight.position.set(15, 25, 12);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 60;
    const shadowD = 22;
    this.dirLight.shadow.camera.left = -shadowD;
    this.dirLight.shadow.camera.right = shadowD;
    this.dirLight.shadow.camera.top = shadowD;
    this.dirLight.shadow.camera.bottom = -shadowD;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Sky gradient hemisphere light
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.4);
    this.scene.add(hemiLight);
  }

  /* Subsystems instantiation */
  initSubsystems() {
    this.maze = new MazeManager(this.scene);
    this.player = new PlayerCharacter(this.scene);
    this.hazards = new HazardManager(this.scene);
    this.items = new ItemManager(this.scene);
    this.shop = new ShopManager(this.player);
  }

  /* Load Level */
  loadLevel(index) {
    this.currentLevelIndex = index;
    this.levelTime = 0;
    this.levelTimerRunning = true;
    this.state = 'PLAYING';

    // Clear victory confetti if any
    this.confettiParticles = [];
    if (this.confettiCtx) {
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
    }

    // Load maze geometry
    const levelData = this.maze.loadLevel(index);

    // Setup player spawn
    this.player.setSpawn(this.maze.startPos.x, this.maze.startPos.z);
    this.player.currentRotation = 0;

    // Reset camera position directly behind player
    this.cameraRotationAngle = 0;
    this.cameraTargetAngle = 0;
    this.cameraPitch = 0.62;
    this.cameraTargetPitch = 0.62;

    // Populate hazards & checkpoints
    this.hazards.populate(this.maze);

    // Populate items (Key & Coins)
    this.items.populate(this.maze);

    // Update HUD
    this.updateLevelHUD(levelData);

    // Start background music
    if (window.audioManager) {
      window.audioManager.startBGM();
    }
  }

  /* Update HUD with current level info */
  updateLevelHUD(levelData) {
    const titleEl = document.getElementById('hud-level-title');
    const subtitleEl = document.getElementById('hud-level-subtitle');
    const keySlot = document.getElementById('hud-key-slot');
    const keyStatusText = document.getElementById('hud-key-status');
    const objectiveBanner = document.getElementById('hud-objective-banner');
    const objectiveText = document.getElementById('hud-objective-text');

    if (titleEl) titleEl.textContent = levelData.title;
    if (subtitleEl) subtitleEl.textContent = levelData.subtitle;

    if (keySlot) keySlot.classList.remove('acquired');
    if (keyStatusText) keyStatusText.textContent = "Not Found";

    if (objectiveBanner) objectiveBanner.classList.remove('has-key');
    if (objectiveText) objectiveText.textContent = "Find the Key 🗝️";

    const levelSelect = document.getElementById('pause-level-select');
    if (levelSelect) {
      levelSelect.value = (this.currentLevelIndex <= 10) ? this.currentLevelIndex.toString() : "11";
    }

    this.shop.updateCoinDisplay();
  }

  /* Setup Keyboard, Mouse, and Touch Controls */
  setupEvents() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      if (this.confettiCanvas) {
        this.confettiCanvas.width = w;
        this.confettiCanvas.height = h;
      }
    });

    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.key) {
        this.keys[e.key] = true;
        this.keys[e.key.toLowerCase()] = true;
      }

      // Prevent default page scrolling when using arrow keys or space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) ||
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.code === 'Space' || e.key === ' ') {
        this.player.jump();
      }

      // Q: drag/rotate game view to the left (nudge on tap)
      if (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q') {
        this.cameraTargetAngle += Math.PI / 10;
      }
      // E: drag/rotate game view to the right (nudge on tap)
      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        this.cameraTargetAngle -= Math.PI / 10;
      }

      if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F') {
        this.toggleFullscreen();
      }

      if (e.code === 'Escape' || e.key === 'Escape' || e.code === 'KeyP' || e.key === 'p' || e.key === 'P') {
        this.togglePause();
      }

      if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
        this.restartLevel();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.key) {
        this.keys[e.key] = false;
        this.keys[e.key.toLowerCase()] = false;
      }
    });

    // Reset keys when window blurs (e.g. user Alt-Tabs or clicks outside the window)
    window.addEventListener('blur', () => {
      this.keys = {};
      this.isDraggingCamera = false;
    });

    // Ensure game iframe/window receives focus on any interaction
    window.addEventListener('pointerdown', () => {
      try { window.focus(); } catch (e) {}
    });

    // Smooth Mouse & Touchpad Dragging (Unified Pointer Events)
    window.addEventListener('pointerdown', (e) => {
      // Don't drag camera if interacting with UI buttons, sliders, or modals
      if (e.target.closest('button, input, select, a, .hud-pill, .modal-card, .shop-item-card, #joystick-zone, #touch-jump-btn')) {
        return;
      }
      if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) {
        return;
      }
      this.isDraggingCamera = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isDraggingCamera) {
        const deltaX = e.clientX - this.lastPointerX;
        const deltaY = e.clientY - this.lastPointerY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;

        // Smooth horizontal look (drag left rotates view left; drag right rotates view right)
        this.cameraTargetAngle -= deltaX * 0.007;

        // Smooth vertical pitch look (bounded to comfortable overhead angle)
        this.cameraTargetPitch = Math.max(0.32, Math.min(0.95, this.cameraTargetPitch + deltaY * 0.004));
      }
    });

    const stopDragging = () => {
      this.isDraggingCamera = false;
    };
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    // Touchpad Two-Finger Scroll / Trackpad Gesture & Mouse Wheel
    window.addEventListener('wheel', (e) => {
      if (e.target.closest('.shop-grid, .modal-card')) return;

      // Touchpad horizontal swipe
      if (Math.abs(e.deltaX) > 2) {
        this.cameraTargetAngle -= e.deltaX * 0.004;
      }
      // Touchpad vertical swipe / mouse wheel zoom
      if (Math.abs(e.deltaY) > 2) {
        this.cameraDistance = Math.max(4.2, Math.min(9.0, this.cameraDistance + e.deltaY * 0.005));
      }
    }, { passive: true });

    // Prevent context menu on canvas
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Fullscreen change listener to sync UI and canvas aspect ratio
    const handleFsChange = () => {
      this.updateFullscreenUI();
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    };
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(ev => {
      document.addEventListener(ev, handleFsChange);
    });

    // Mobile Virtual Joystick setup
    this.setupMobileControls();
  }

  /* Virtual Mobile Joystick & Action Buttons */
  setupMobileControls() {
    const mobileControls = document.getElementById('mobile-controls');
    const enableTouch = () => {
      if (mobileControls) {
        mobileControls.classList.add('active');
      }
    };

    // Auto-detect mobile devices (iPhone, Android, touch tablets)
    const isTouchOnly = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) &&
      (window.innerWidth <= 1180 || window.matchMedia('(pointer: coarse)').matches);

    if (isTouchOnly) {
      enableTouch();
    }

    // Fallback: If user touches screen at any point, activate touch UI
    window.addEventListener('touchstart', () => {
      if (window.innerWidth <= 1280 || window.matchMedia('(pointer: coarse)').matches) {
        enableTouch();
      }
    }, { passive: true });

    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');
    const touchJump = document.getElementById('touch-jump-btn');

    if (touchJump) {
      touchJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.player.jump();
      });
    }

    if (joystickZone && joystickKnob) {
      let touchId = null;
      let center = { x: 0, y: 0 };
      const maxRadius = 45;

      joystickZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const rect = joystickZone.getBoundingClientRect();
        center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        this.handleJoystickMove(touch.clientX, touch.clientY, center, maxRadius, joystickKnob);
      });

      window.addEventListener('touchmove', (e) => {
        if (touchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            this.handleJoystickMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY, center, maxRadius, joystickKnob);
            break;
          }
        }
      });

      const endJoystick = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            touchId = null;
            this.joystickDir.set(0, 0);
            joystickKnob.style.transform = `translate(0px, 0px)`;
            break;
          }
        }
      };

      window.addEventListener('touchend', endJoystick);
      window.addEventListener('touchcancel', endJoystick);
    }

    // Touch swipe on upper screen for camera rotation
    let camTouchX = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        camTouchX = e.touches[0].clientX;
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - camTouchX;
        this.cameraTargetAngle += deltaX * 0.008;
        camTouchX = e.touches[0].clientX;
      }
    });
  }

  handleJoystickMove(x, y, center, maxRadius, knob) {
    const dx = x - center.x;
    const dy = y - center.y;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    // Deadzone
    if (dist > 8) {
      this.joystickDir.x = knobX / maxRadius;
      this.joystickDir.y = knobY / maxRadius;
    } else {
      this.joystickDir.set(0, 0);
    }
  }

  /* Setup Buttons & Modal Interactions */
  setupUI() {
    // HUD Buttons
    const btnPause = document.getElementById('hud-btn-pause');
    const btnShop = document.getElementById('hud-btn-shop');
    const btnSound = document.getElementById('hud-btn-sound');
    const btnRestart = document.getElementById('hud-btn-restart');
    const btnFullscreen = document.getElementById('hud-btn-fullscreen');

    if (btnPause) btnPause.addEventListener('click', () => this.togglePause());
    if (btnShop) btnShop.addEventListener('click', () => this.openShop());
    if (btnRestart) btnRestart.addEventListener('click', () => this.restartLevel());
    if (btnFullscreen) btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const isMuted = window.audioManager.toggleMute();
        btnSound.innerHTML = isMuted
          ? `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`
          : `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
      });
    }

    // Pause Modal Buttons
    const btnResume = document.getElementById('pause-btn-resume');
    const btnPauseRestart = document.getElementById('pause-btn-restart');
    const btnPauseShop = document.getElementById('pause-btn-shop');
    const btnPauseFs = document.getElementById('pause-btn-fullscreen');
    const levelSelect = document.getElementById('pause-level-select');

    if (btnResume) btnResume.addEventListener('click', () => this.togglePause());
    if (btnPauseRestart) btnPauseRestart.addEventListener('click', () => { this.togglePause(); this.restartLevel(); });
    if (btnPauseShop) btnPauseShop.addEventListener('click', () => { this.togglePause(); this.openShop(); });
    if (btnPauseFs) btnPauseFs.addEventListener('click', () => this.toggleFullscreen());

    if (levelSelect) {
      levelSelect.addEventListener('change', (e) => {
        const selectedLvl = parseInt(e.target.value, 10);
        this.togglePause();
        this.loadLevel(selectedLvl);
      });
    }

    // Victory Screen Buttons
    const btnNextLevel = document.getElementById('victory-btn-next');
    const btnReplay = document.getElementById('victory-btn-replay');
    const btnVictoryShop = document.getElementById('victory-btn-shop');

    if (btnNextLevel) {
      btnNextLevel.addEventListener('click', () => {
        document.getElementById('victory-modal').classList.remove('active');
        this.loadLevel(this.currentLevelIndex + 1);
      });
    }
    if (btnReplay) {
      btnReplay.addEventListener('click', () => {
        document.getElementById('victory-modal').classList.remove('active');
        this.restartLevel();
      });
    }
    if (btnVictoryShop) {
      btnVictoryShop.addEventListener('click', () => {
        document.getElementById('victory-modal').classList.remove('active');
        this.openShop();
      });
    }

    // Audio Settings Sliders
    const musicSlider = document.getElementById('music-vol-slider');
    const sfxSlider = document.getElementById('sfx-vol-slider');

    if (musicSlider) {
      musicSlider.value = window.audioManager.musicVolume;
      musicSlider.addEventListener('input', (e) => {
        window.audioManager.setMusicVolume(parseFloat(e.target.value));
      });
    }

    if (sfxSlider) {
      sfxSlider.value = window.audioManager.sfxVolume;
      sfxSlider.addEventListener('input', (e) => {
        window.audioManager.setSfxVolume(parseFloat(e.target.value));
      });
    }
  }

  togglePause() {
    const pauseModal = document.getElementById('pause-modal');
    if (!pauseModal) return;

    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.levelTimerRunning = false;
      pauseModal.classList.add('active');
      if (window.audioManager) window.audioManager.stopBGM();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.levelTimerRunning = true;
      pauseModal.classList.remove('active');
      if (window.audioManager) window.audioManager.startBGM();
    }
  }

  restartLevel() {
    this.loadLevel(this.currentLevelIndex);
    this.showCenterNotification("Level Restarted 🔄");
  }

  openShop() {
    this.shop.open();
  }

  showCenterNotification(msg) {
    const el = document.getElementById('center-notification');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => {
      el.classList.remove('show');
    }, 1800);
  }

  /* Trigger Level Completed Victory Sequence */
  handleLevelComplete() {
    if (this.state === 'LEVEL_COMPLETE') return;
    this.state = 'LEVEL_COMPLETE';
    this.levelTimerRunning = false;

    // Trigger player cheer animation
    this.player.triggerVictory();

    // Play victory fanfare
    if (window.audioManager) {
      window.audioManager.playLevelComplete();
    }

    // Calculate level stats & stars
    const timeSec = Math.floor(this.levelTime);
    const mins = Math.floor(timeSec / 60);
    const secs = timeSec % 60;
    const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    const totalCoins = this.items.totalLevelCoins || 1;
    const collectedCoins = this.items.collectedLevelCoins;
    const coinRatio = collectedCoins / totalCoins;

    // Stars rating: 1 star guaranteed for completion, 2 stars for 70%+, 3 stars for 100%
    let stars = 1;
    if (coinRatio >= 0.95) stars = 3;
    else if (coinRatio >= 0.70) stars = 2;

    // Update Victory Modal Elements
    const victoryModal = document.getElementById('victory-modal');
    const timeEl = document.getElementById('victory-stat-time');
    const coinsEl = document.getElementById('victory-stat-coins');
    const starsContainer = document.getElementById('victory-stars-box');

    if (timeEl) timeEl.textContent = timeFormatted;
    if (coinsEl) coinsEl.textContent = `${collectedCoins} / ${totalCoins}`;

    if (starsContainer) {
      starsContainer.innerHTML = '';
      for (let i = 1; i <= 3; i++) {
        const span = document.createElement('span');
        span.className = `star-icon ${i <= stars ? 'filled' : ''}`;
        span.textContent = '★';
        starsContainer.appendChild(span);
      }
    }

    // Trigger celebration confetti
    this.launchConfetti();

    // Show victory modal after brief delay
    setTimeout(() => {
      if (victoryModal) victoryModal.classList.add('active');
    }, 1200);
  }

  /* Confetti Celebration Generator */
  launchConfetti() {
    if (!this.confettiCanvas) return;
    this.confettiCanvas.width = window.innerWidth;
    this.confettiCanvas.height = window.innerHeight;

    const colors = ['#38bdf8', '#f59e0b', '#fbbf24', '#10b981', '#ec4899', '#8b5cf6'];
    this.confettiParticles = [];

    for (let i = 0; i < 120; i++) {
      this.confettiParticles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 6,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10
      });
    }
  }

  updateConfetti() {
    if (!this.confettiCtx || this.confettiParticles.length === 0) return;
    this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);

    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const p = this.confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.rotation += p.rotSpeed;

      this.confettiCtx.save();
      this.confettiCtx.translate(p.x, p.y);
      this.confettiCtx.rotate((p.rotation * Math.PI) / 180);
      this.confettiCtx.fillStyle = p.color;
      this.confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      this.confettiCtx.restore();

      if (p.y > window.innerHeight) {
        this.confettiParticles.splice(i, 1);
      }
    }
  }

  /* Compute Input Direction Vector (Relative to Camera Angle) */
  getInputDirection() {
    let moveForward = 0;
    let moveRight = 0;

    // Keyboard inputs:
    // W / ArrowUp: move forward (+1)
    // S / ArrowDown: move backward (-1)
    // A / ArrowLeft: move left (-1)
    // D / ArrowRight: move right (+1)
    const up = this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'];
    const down = this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['s'] || this.keys['S'];
    const right = this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'];
    const left = this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'];

    if (up) moveForward += 1;
    if (down) moveForward -= 1;
    if (right) moveRight += 1;
    if (left) moveRight -= 1;

    // Add mobile joystick input
    if (this.joystickDir.lengthSq() > 0.01) {
      moveRight += this.joystickDir.x;
      moveForward -= this.joystickDir.y;
    }

    const input = new THREE.Vector2(moveRight, moveForward);
    if (input.lengthSq() > 1.0) {
      input.normalize();
    }

    if (input.lengthSq() < 0.001) {
      return new THREE.Vector3(0, 0, 0);
    }

    // Camera horizontal orientation angle
    const angle = this.cameraRotationAngle;

    // Forward direction from camera to player: (-sin(angle), -cos(angle))
    // Right direction relative to camera: (cos(angle), -sin(angle))
    const forwardX = -Math.sin(angle);
    const forwardZ = -Math.cos(angle);
    const rightX = Math.cos(angle);
    const rightZ = -Math.sin(angle);

    const worldDir = new THREE.Vector3(
      input.y * forwardX + input.x * rightX,
      0,
      input.y * forwardZ + input.x * rightZ
    );

    return worldDir;
  }

  /* Smooth Third-Person Chase Camera with Obstacle Transparency */
  updateCamera(delta) {
    // Q: continuously rotate game view to the left while held
    if (this.keys['KeyQ']) {
      this.cameraTargetAngle += 2.4 * delta;
    }
    // E: continuously rotate game view to the right while held
    if (this.keys['KeyE']) {
      this.cameraTargetAngle -= 2.4 * delta;
    }

    // Smooth angle & pitch interpolation
    this.cameraRotationAngle += (this.cameraTargetAngle - this.cameraRotationAngle) * Math.min(1.0, 14.0 * delta);
    this.cameraPitch += (this.cameraTargetPitch - this.cameraPitch) * Math.min(1.0, 10.0 * delta);

    // Compute ideal camera position in spherical coordinates relative to player
    const pPos = this.player.position;
    const camX = pPos.x + Math.sin(this.cameraRotationAngle) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const camY = pPos.y + Math.sin(this.cameraPitch) * this.cameraDistance + 0.6;
    const camZ = pPos.z + Math.cos(this.cameraRotationAngle) * Math.cos(this.cameraPitch) * this.cameraDistance;

    // Smooth camera damping (Lerp)
    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), Math.min(1.0, 10.0 * delta));

    // Look slightly above the player's head
    const lookTarget = new THREE.Vector3(pPos.x, pPos.y + 0.8, pPos.z);
    this.camera.lookAt(lookTarget);

    // Sun follows player for crisp directional shadows across the entire maze
    if (this.dirLight) {
      this.dirLight.position.set(pPos.x + 15, 25, pPos.z + 12);
      this.dirLight.target.position.copy(pPos);
      this.dirLight.target.updateMatrixWorld();
    }

    // Raycast Wall Dithering / Fade: Ensure Player is ALWAYS Visible!
    this.updateWallTransparency(lookTarget);
  }

  /* Make walls between camera and player semi-transparent so player is NEVER blocked */
  updateWallTransparency(targetPos) {
    const camPos = this.camera.position;
    const dir = new THREE.Vector3().subVectors(targetPos, camPos).normalize();
    const dist = camPos.distanceTo(targetPos);

    this.raycaster.set(camPos, dir);
    this.raycaster.near = 0.2;
    this.raycaster.far = dist - 0.3;

    const hits = this.raycaster.intersectObjects(this.maze.wallMeshes);
    const newTransparentWalls = new Set();

    hits.forEach(hit => {
      const mesh = hit.object;
      mesh.material.opacity = 0.25;
      mesh.material.transparent = true;
      newTransparentWalls.add(mesh);
    });

    // Restore opacity on walls no longer blocking the camera
    this.transparentWalls.forEach(mesh => {
      if (!newTransparentWalls.has(mesh)) {
        mesh.material.opacity = 1.0;
      }
    });

    this.transparentWalls = newTransparentWalls;
  }

  /* Draw 2D Minimap Radar */
  drawMinimap() {
    if (!this.minimapCtx || !this.maze.grid.length) return;
    const ctx = this.minimapCtx;
    const size = this.minimapCanvas.width;
    ctx.clearRect(0, 0, size, size);

    const gw = this.maze.width;
    const gh = this.maze.height;
    const cellSize = size / Math.max(gw, gh);

    // Offset to center maze inside radar circle
    const offsetX = (size - gw * cellSize) / 2;
    const offsetY = (size - gh * cellSize) / 2;

    // 1. Draw maze walls & paths
    for (let z = 0; z < gh; z++) {
      for (let x = 0; x < gw; x++) {
        if (this.maze.grid[z][x] === '#') {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(offsetX + x * cellSize, offsetY + z * cellSize, cellSize + 0.5, cellSize + 0.5);
        }
      }
    }

    // 2. Draw Magic Key (if not yet collected)
    if (this.items.keyItem && !this.items.keyItem.collected) {
      const kGridX = (this.items.keyItem.x / this.maze.cellSize) + gw / 2;
      const kGridZ = (this.items.keyItem.z / this.maze.cellSize) + gh / 2;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(offsetX + kGridX * cellSize, offsetY + kGridZ * cellSize, cellSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw Exit Portal
    const eGridX = (this.maze.exitPos.x / this.maze.cellSize) + gw / 2;
    const eGridZ = (this.maze.exitPos.z / this.maze.cellSize) + gh / 2;
    ctx.fillStyle = this.maze.isExitUnlocked ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.arc(offsetX + eGridX * cellSize, offsetY + eGridZ * cellSize, cellSize * 0.75, 0, Math.PI * 2);
    ctx.fill();

    // 4. Draw Player Position & Direction Cone
    const pGridX = (this.player.position.x / this.maze.cellSize) + gw / 2;
    const pGridZ = (this.player.position.z / this.maze.cellSize) + gh / 2;
    const px = offsetX + pGridX * cellSize;
    const py = offsetY + pGridZ * cellSize;

    // Vision cone
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.moveTo(px, py);
    const coneAngle = this.player.currentRotation;
    ctx.arc(px, py, cellSize * 2.5, coneAngle - 0.5, coneAngle + 0.5);
    ctx.closePath();
    ctx.fill();

    // Player dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, cellSize * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /* Main Game Loop */
  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Update Shop 3D Preview if shop is active
    if (this.shop) {
      this.shop.renderPreview(delta);
    }

    if (this.state === 'PLAYING') {
      // Level Timer
      if (this.levelTimerRunning) {
        this.levelTime += delta;
      }

      // Read Input & Sprint
      const isSprinting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['Shift']);
      const inputDir = this.getInputDirection();

      // Update Player Physics
      this.player.update(delta, inputDir, isSprinting, this.maze);

      // Update Hazards & Fair Checkpoints
      this.hazards.update(delta, this.player, () => {
        this.showCenterNotification("Checkpoint Saved! 📍");
      });

      // Update Collectibles (Key & Coins)
      this.items.update(
        delta,
        this.player,
        // On Key Collected:
        () => {
          this.maze.unlockExit();
          this.showCenterNotification("KEY ACQUIRED! Exit Unlocked! ✨");

          const keySlot = document.getElementById('hud-key-slot');
          const keyStatusText = document.getElementById('hud-key-status');
          const objectiveBanner = document.getElementById('hud-objective-banner');
          const objectiveText = document.getElementById('hud-objective-text');

          if (keySlot) keySlot.classList.add('acquired');
          if (keyStatusText) keyStatusText.textContent = "Acquired!";
          if (objectiveBanner) objectiveBanner.classList.add('has-key');
          if (objectiveText) objectiveText.textContent = "Exit Portal Unlocked! 🚪";
        },
        // On Coin Collected:
        (totalBank, levelCollected, levelTotal) => {
          this.shop.updateCoinDisplay();
        }
      );

      // Update Exit Portal Animations
      this.maze.update(delta);

      // Test Exit Portal Trigger
      if (this.maze.isExitUnlocked) {
        const pPos = this.player.position;
        const dx = pPos.x - this.maze.exitPos.x;
        const dz = pPos.z - this.maze.exitPos.z;
        if (dx * dx + dz * dz < 1.2 * 1.2) {
          this.handleLevelComplete();
        }
      }
    }

    // Update Chase Camera
    this.updateCamera(delta);

    // Update Minimap Radar
    this.drawMinimap();

    // Update Victory Confetti
    this.updateConfetti();

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  /* Fullscreen Handling across desktop, laptop, mobile, Chrome, Safari, Firefox, Edge */
  toggleFullscreen() {
    const doc = window.document;
    const docEl = doc.documentElement;

    const isFs = !!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);

    if (!isFs) {
      const requestFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
      if (requestFs) {
        const promise = requestFs.call(docEl);
        if (promise && promise.catch) {
          promise.catch(err => console.warn("Fullscreen request error:", err));
        }
      }
    } else {
      const cancelFs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      if (cancelFs) {
        const promise = cancelFs.call(doc);
        if (promise && promise.catch) {
          promise.catch(err => console.warn("Fullscreen exit error:", err));
        }
      }
    }
  }

  updateFullscreenUI() {
    const doc = window.document;
    const isFs = !!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
    const hudFsBtn = document.getElementById('hud-btn-fullscreen');
    const pauseFsBtn = document.getElementById('pause-btn-fullscreen');

    const enterSvg = `<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
    const exitSvg = `<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z"/></svg>`;

    if (hudFsBtn) {
      hudFsBtn.innerHTML = isFs ? exitSvg : enterSvg;
      hudFsBtn.title = isFs ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)";
    }
    if (pauseFsBtn) {
      pauseFsBtn.innerHTML = isFs ? (exitSvg + ` Exit Fullscreen`) : (enterSvg + ` Fullscreen (F)`);
    }
  }
}

// Start game engine on page load
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
});
