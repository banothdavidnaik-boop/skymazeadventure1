/* ========================================================
   3D MAZE ADVENTURE - AVATAR & COSTUME SHOP
   3D live preview, persistent coin banking,
   unlockable avatars, and costume color palettes
   ======================================================== */

class ShopManager {
  constructor(player) {
    this.player = player;

    // Load persistent state
    this.initStorage();

    // Active tab in shop UI ('avatars' or 'costumes')
    this.activeTab = 'avatars';
    this.previewAvatarId = this.equippedAvatar;
    this.previewCostumeId = this.equippedCostume;

    // 3D Shop Preview Engine
    this.previewRenderer = null;
    this.previewScene = null;
    this.previewCamera = null;
    this.previewCharacter = null;
    this.previewRotation = 0;
    this.isDraggingPreview = false;
    this.prevMouseX = 0;

    // Define Catalog
    this.avatars = [
      { id: 'astro', name: 'Astro Scout', desc: 'Cosmic explorer with high-tech helmet & thrusters.', price: 0, icon: '🚀' },
      { id: 'robot', name: 'Mecha Bot', desc: 'Futuristic automaton with glowing LED face screen.', price: 20, icon: '🤖' },
      { id: 'ninja', name: 'Cyber Ninja', desc: 'Master of shadows with blade and stealth visor.', price: 35, icon: '🥷' },
      { id: 'mage', name: 'Mystic Mage', desc: 'Arcane wizard with pointed hat and orbiting mana orb.', price: 50, icon: '🧙' },
      { id: 'knight', name: 'Royal Knight', desc: 'Courageous defender in plate armor & greathelm.', price: 70, icon: '🛡️' },
      { id: 'fox', name: 'Cosmic Fox', desc: 'Cunning, agile spirit guide with fluffy tail.', price: 90, icon: '🦊' },
      { id: 'dragon', name: 'Pyro Drake', desc: 'Fierce dragon champion with curved horns & scaled crest.', price: 110, icon: '🐲' },
      { id: 'samurai', name: 'Cyber Samurai', desc: 'Cybernetic ronin with Kabuto crest & shoulder sode.', price: 130, icon: '⚔️' },
      { id: 'ranger', name: 'Space Ranger', desc: 'Tactical scout with jump thrusters & visor scanner.', price: 150, icon: '🌌' },
      { id: 'monarch', name: 'Celestial Monarch', desc: 'Regal sovereign with shimmering crown & floating scepter.', price: 180, icon: '👑' }
    ];

    this.costumes = [
      { id: 'classic', name: 'Sky Explorer', desc: 'Signature sky-blue and amber gold attire.', price: 0, icon: '🎽' },
      { id: 'cyberpunk', name: 'Neon City', desc: 'Midnight navy with vivid neon cyan and magenta.', price: 25, icon: '🌆' },
      { id: 'gold', name: 'Imperial Gold', desc: 'Lustrous polished gold for true champions.', price: 45, icon: '✨' },
      { id: 'shadow', name: 'Void Shadow', desc: 'Deep violet and obsidian with nebula energy.', price: 60, icon: '🔮' },
      { id: 'emerald', name: 'Jade Forest', desc: 'Deep emerald greens and radiant neon lime accents.', price: 80, icon: '🍃' },
      { id: 'crimson', name: 'Molten Magma', desc: 'Basalt obsidian infused with glowing molten lava.', price: 100, icon: '🔥' },
      { id: 'arctic', name: 'Frost Glaciers', desc: 'Crystalline ice blue, glacier cyan, and pure snow white.', price: 125, icon: '❄️' },
      { id: 'vaporwave', name: 'Cyber Pastel', desc: 'Dreamy pastel lavender, bubblegum pink, and mint foam.', price: 150, icon: '🌸' }
    ];

    // Setup Shop Modal UI & Event Listeners
    this.setupUI();
  }

  initStorage() {
    let coinsVal = 10;
    try {
      if (localStorage.getItem('maze_bank_coins') === null) {
        localStorage.setItem('maze_bank_coins', '10');
      }
      coinsVal = parseInt(localStorage.getItem('maze_bank_coins') || '10', 10);
    } catch (e) {
      coinsVal = 10;
    }
    this.coins = coinsVal;

    // Unlocked items
    let unlocked = [];
    try {
      unlocked = JSON.parse(localStorage.getItem('maze_unlocked_items') || '["astro", "classic"]');
    } catch (e) {
      unlocked = ['astro', 'classic'];
    }
    this.unlockedItems = new Set(unlocked);

    // Equipped items
    let av = 'astro', cs = 'classic';
    try {
      av = localStorage.getItem('maze_equipped_avatar') || 'astro';
      cs = localStorage.getItem('maze_equipped_costume') || 'classic';
    } catch (e) {}
    this.equippedAvatar = av;
    this.equippedCostume = cs;
  }

  saveStorage() {
    try {
      localStorage.setItem('maze_bank_coins', this.coins);
      localStorage.setItem('maze_unlocked_items', JSON.stringify(Array.from(this.unlockedItems)));
      localStorage.setItem('maze_equipped_avatar', this.equippedAvatar);
      localStorage.setItem('maze_equipped_costume', this.equippedCostume);
    } catch (e) {}
  }

  /* Setup DOM elements and tab switches */
  setupUI() {
    const tabAvatars = document.getElementById('shop-tab-avatars');
    const tabCostumes = document.getElementById('shop-tab-costumes');
    const btnClose = document.getElementById('shop-close-btn');
    const btnAddCoins = document.getElementById('shop-bonus-coins');

    if (tabAvatars) {
      tabAvatars.addEventListener('click', () => {
        this.activeTab = 'avatars';
        tabAvatars.classList.add('active');
        if (tabCostumes) tabCostumes.classList.remove('active');
        this.renderCatalog();
        if (window.audioManager) window.audioManager.playClick();
      });
    }

    if (tabCostumes) {
      tabCostumes.addEventListener('click', () => {
        this.activeTab = 'costumes';
        tabCostumes.classList.add('active');
        if (tabAvatars) tabAvatars.classList.remove('active');
        this.renderCatalog();
        if (window.audioManager) window.audioManager.playClick();
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        this.close();
      });
    }

    if (btnAddCoins) {
      btnAddCoins.addEventListener('click', () => {
        this.coins += 50;
        this.saveStorage();
        this.updateCoinDisplay();
        this.renderCatalog();
        if (window.audioManager) window.audioManager.playPurchase();
      });
    }

    // Init 3D Preview Canvas
    this.init3DPreview();
  }

  /* 3D Preview Viewport */
  init3DPreview() {
    const canvas = document.getElementById('shop-preview-canvas');
    if (!canvas) return;

    const width = canvas.parentElement.clientWidth || 280;
    const height = canvas.parentElement.clientHeight || 280;

    this.previewScene = new THREE.Scene();
    this.previewScene.background = new THREE.Color(0x0f172a);

    this.previewCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.previewCamera.position.set(0, 1.2, 3.2);
    this.previewCamera.lookAt(0, 0.5, 0);

    // Warm Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.previewScene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(2, 4, 3);
    this.previewScene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 0.8);
    rimLight.position.set(-2, 2, -2);
    this.previewScene.add(rimLight);

    // Pedestal disk
    const diskGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.08, 24);
    const diskMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.position.y = -0.04;
    this.previewScene.add(disk);

    try {
      this.previewRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      this.previewRenderer.setSize(width, height);
      this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch(e) {
      console.warn("Unable to create WebGL preview", e);
    }

    // Interactive Drag Rotation
    canvas.addEventListener('mousedown', (e) => {
      this.isDraggingPreview = true;
      this.prevMouseX = e.clientX;
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingPreview = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDraggingPreview && this.previewCharacter) {
        const deltaX = e.clientX - this.prevMouseX;
        this.previewRotation += deltaX * 0.015;
        this.prevMouseX = e.clientX;
      }
    });

    // Touch support for drag rotate
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.isDraggingPreview = true;
        this.prevMouseX = e.touches[0].clientX;
      }
    });
    window.addEventListener('touchend', () => {
      this.isDraggingPreview = false;
    });
    window.addEventListener('touchmove', (e) => {
      if (this.isDraggingPreview && this.previewCharacter && e.touches.length > 0) {
        const deltaX = e.touches[0].clientX - this.prevMouseX;
        this.previewRotation += deltaX * 0.015;
        this.prevMouseX = e.touches[0].clientX;
      }
    });
  }

  /* Build / Update 3D Model in Preview Viewport */
  updatePreviewModel() {
    if (!this.previewScene) return;

    if (this.previewCharacter) {
      this.previewScene.remove(this.previewCharacter.group);
    }

    // Instantiate temporary player rig for preview
    this.previewCharacter = new PlayerCharacter(this.previewScene);
    this.previewCharacter.setAvatarAndCostume(this.previewAvatarId, this.previewCostumeId);
    this.previewCharacter.position.set(0, 0, 0);
  }

  /* Render Catalog Items in Grid */
  renderCatalog() {
    const grid = document.getElementById('shop-items-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const items = (this.activeTab === 'avatars') ? this.avatars : this.costumes;
    const equippedId = (this.activeTab === 'avatars') ? this.equippedAvatar : this.equippedCostume;

    items.forEach(item => {
      const isOwned = this.unlockedItems.has(item.id);
      const isEquipped = (item.id === equippedId);

      const card = document.createElement('div');
      card.className = `shop-item-card ${isEquipped ? 'equipped' : ''}`;
      card.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-price">
          ${isEquipped ? 'Equipped' : (isOwned ? 'Owned' : `🪙 ${item.price}`)}
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectItem(item);
      });

      grid.appendChild(card);
    });

    this.updatePreviewModel();
    this.updateActionDetails();
  }

  /* Handle Item Selection / Purchase / Equip */
  selectItem(item) {
    if (this.activeTab === 'avatars') {
      this.previewAvatarId = item.id;
    } else {
      this.previewCostumeId = item.id;
    }

    this.updatePreviewModel();
    this.updateActionDetails();
  }

  updateActionDetails() {
    const selectedItem = (this.activeTab === 'avatars')
      ? this.avatars.find(a => a.id === this.previewAvatarId)
      : this.costumes.find(c => c.id === this.previewCostumeId);

    if (!selectedItem) return;

    const nameEl = document.getElementById('shop-preview-name');
    const descEl = document.getElementById('shop-preview-desc');
    const actionBtn = document.getElementById('shop-action-btn');

    if (nameEl) nameEl.textContent = selectedItem.name;
    if (descEl) descEl.textContent = selectedItem.desc;

    if (!actionBtn) return;

    const isOwned = this.unlockedItems.has(selectedItem.id);
    const isEquipped = (this.activeTab === 'avatars')
      ? (this.equippedAvatar === selectedItem.id)
      : (this.equippedCostume === selectedItem.id);

    // Reset button listeners by cloning
    const newBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newBtn, actionBtn);

    if (isEquipped) {
      newBtn.textContent = 'Equipped';
      newBtn.className = 'btn btn-secondary';
      newBtn.disabled = true;
    } else if (isOwned) {
      newBtn.textContent = 'Equip';
      newBtn.className = 'btn btn-primary';
      newBtn.disabled = false;
      newBtn.addEventListener('click', () => {
        this.equipItem(selectedItem.id);
      });
    } else {
      const canAfford = (this.coins >= selectedItem.price);
      newBtn.innerHTML = `Unlock for 🪙 ${selectedItem.price}`;
      newBtn.className = canAfford ? 'btn btn-gold' : 'btn btn-secondary';
      newBtn.disabled = !canAfford;

      if (canAfford) {
        newBtn.addEventListener('click', () => {
          this.buyItem(selectedItem);
        });
      }
    }
  }

  buyItem(item) {
    if (this.coins >= item.price) {
      this.coins -= item.price;
      this.unlockedItems.add(item.id);
      this.saveStorage();

      if (window.audioManager) {
        window.audioManager.playPurchase();
      }

      this.equipItem(item.id);
      this.updateCoinDisplay();
    }
  }

  equipItem(itemId) {
    if (this.activeTab === 'avatars') {
      this.equippedAvatar = itemId;
      this.previewAvatarId = itemId;
    } else {
      this.equippedCostume = itemId;
      this.previewCostumeId = itemId;
    }

    this.saveStorage();

    // Update in-game player character immediately!
    if (this.player) {
      this.player.setAvatarAndCostume(this.equippedAvatar, this.equippedCostume);
    }

    if (window.audioManager) {
      window.audioManager.playClick();
    }

    this.renderCatalog();
  }

  updateCoinDisplay() {
    const coinEl = document.getElementById('shop-coin-balance');
    const hudCoins = document.getElementById('hud-coin-count');
    if (coinEl) coinEl.textContent = this.coins;
    if (hudCoins) hudCoins.textContent = this.coins;
  }

  open() {
    const modal = document.getElementById('shop-modal');
    if (modal) {
      modal.classList.add('active');
    }
    try {
      this.coins = parseInt(localStorage.getItem('maze_bank_coins') || '10', 10);
    } catch (e) {}
    this.previewAvatarId = this.equippedAvatar;
    this.previewCostumeId = this.equippedCostume;
    this.updateCoinDisplay();
    this.renderCatalog();
  }

  close() {
    const modal = document.getElementById('shop-modal');
    if (modal) {
      modal.classList.remove('active');
    }
    if (window.audioManager) {
      window.audioManager.playClick();
    }
  }

  /* Render frame for 3D Shop Preview */
  renderPreview(delta) {
    if (!this.previewRenderer || !this.previewScene || !this.previewCamera) return;

    if (this.previewCharacter) {
      // Auto gentle rotate if not actively dragging
      if (!this.isDraggingPreview) {
        this.previewRotation += delta * 0.8;
      }
      this.previewCharacter.group.rotation.y = this.previewRotation;

      // Idle breathing in preview
      this.previewCharacter.walkCycle += delta * 2.0;
      this.previewCharacter.animateLimbs(0);
    }

    this.previewRenderer.render(this.previewScene, this.previewCamera);
  }
}

