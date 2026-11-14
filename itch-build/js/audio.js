/* ========================================================
   3D MAZE ADVENTURE - PROCEDURAL AUDIO ENGINE (V2 POLISHED)
   100% self-contained Web Audio API synthesizer
   Silky-smooth BGM & sound effects with analog warmth,
   anti-click envelopes, and zero vibration/haptics
   ======================================================== */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.musicFilter = null;
    this.sfxGain = null;

    // Volume settings (0.0 to 1.0)
    let mv = '0.5', sv = '0.7', mu = 'false';
    try {
      mv = localStorage.getItem('maze_music_vol') || '0.5';
      sv = localStorage.getItem('maze_sfx_vol') || '0.7';
      mu = localStorage.getItem('maze_muted') || 'false';
    } catch (e) {}
    this.musicVolume = parseFloat(mv);
    this.sfxVolume = parseFloat(sv);
    this.isMuted = mu === 'true';

    // Music playback state
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.currentBeat = 0;
    this.tempo = 110; // Relaxed, bouncy adventure tempo

    // Pre-bind init on user gesture
    this.initContext = this.initContext.bind(this);
    window.addEventListener('click', this.initContext, { once: true });
    window.addEventListener('keydown', this.initContext, { once: true });
    window.addEventListener('touchstart', this.initContext, { once: true });
    window.addEventListener('pointerdown', this.initContext, { once: true });
  }

  initContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Music Channel with Warm Analog Low-pass Filter (removes harsh digital edges)
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);

      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.setValueAtTime(2600, this.ctx.currentTime);
      this.musicFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      this.musicGain.connect(this.musicFilter);
      this.musicFilter.connect(this.masterGain);

      // SFX Channel
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Start music if requested
      if (this.isPlayingMusic) {
        this.startBGM();
      }
    } catch (e) {
      console.warn("Web Audio API not supported or blocked", e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.initContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    try { localStorage.setItem('maze_music_vol', this.musicVolume); } catch (e) {}
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    try { localStorage.setItem('maze_sfx_vol', this.sfxVolume); } catch (e) {}
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  setMuted(mute) {
    this.isMuted = !!mute;
    try { localStorage.setItem('maze_muted', this.isMuted); } catch (e) {}
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /* ========================================================
     BACKGROUND MUSIC: Warm Melodic Adventure Synthesizer
     ======================================================== */
  startBGM() {
    this.isPlayingMusic = true;
    if (!this.ctx) return;
    this.ensureContext();
    if (this.musicTimer) return;

    this.currentBeat = 0;
    const beatInterval = (60 / this.tempo) * 1000 / 2; // 8th notes

    // Lush 4-bar chord progression with rich 7th & 9th harmonies
    const chords = [
      // Bar 1: Cmaj9 (bright, uplifting, peaceful)
      { bass: 130.81, notes: [261.63, 329.63, 392.00, 493.88] },
      // Bar 2: Am9 (adventurous, emotional)
      { bass: 110.00, notes: [220.00, 261.63, 329.63, 392.00] },
      // Bar 3: Fmaj7 (warm, expansive)
      { bass: 87.31,  notes: [220.00, 261.63, 329.63, 349.23] },
      // Bar 4: G9sus4 (triumphant resolution)
      { bass: 98.00,  notes: [246.94, 293.66, 349.23, 440.00] }
    ];

    // Smooth, memorable adventure melody
    const melody = [
      523.25, 0, 587.33, 659.25, 0, 783.99, 659.25, 587.33,
      523.25, 0, 392.00, 523.25, 659.25, 0, 587.33, 0,
      440.00, 0, 523.25, 659.25, 783.99, 0, 659.25, 523.25,
      587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33, 0
    ];

    const playStep = () => {
      if (!this.isPlayingMusic) return;

      const chordIdx = Math.floor((this.currentBeat % 32) / 8);
      const currentChord = chords[chordIdx];
      const stepInChord = this.currentBeat % 8;

      // Warm walking bass with soft attack
      if (stepInChord === 0 || stepInChord === 4) {
        this.playSmoothTone(currentChord.bass, 'triangle', 0.015, 0.28, 0.16, this.musicGain);
      } else if (stepInChord === 6) {
        this.playSmoothTone(currentChord.bass * 1.5, 'sine', 0.015, 0.18, 0.10, this.musicGain);
      }

      // Soft ambient chord pad on beat 0
      if (stepInChord === 0) {
        currentChord.notes.forEach(freq => {
          this.playSmoothTone(freq, 'sine', 0.04, 0.85, 0.035, this.musicGain);
        });
      }

      // Crystal melodic plucks
      const melFreq = melody[this.currentBeat % 32];
      if (melFreq > 0) {
        this.playPluck(melFreq, 0.22, 0.065, this.musicGain);
      }

      // Subtle organic rhythm (soft brushes)
      if (stepInChord % 2 === 0) {
        this.playSoftHiHat(stepInChord === 4 ? 0.03 : 0.015);
      }

      this.currentBeat++;
      this.musicTimer = setTimeout(playStep, beatInterval);
    };

    playStep();
  }

  stopBGM() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  /* Anti-click Smooth Tone Generator with ADSR-like Envelope */
  playSmoothTone(freq, type, attack, duration, vol, outputNode) {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);

      // Smooth attack to avoid clicks
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(outputNode || this.sfxGain);

      osc.start(t);
      osc.stop(t + duration);
    } catch(e) {}
  }

  playPluck(freq, duration, vol, outputNode) {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      // Gentle pluck envelope
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(outputNode || this.sfxGain);

      osc.start(t);
      osc.stop(t + duration);
    } catch(e) {}
  }

  playSoftHiHat(vol = 0.02) {
    if (!this.ctx || this.isMuted) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.035;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(8000, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      noise.start(t);
    } catch(e) {}
  }

  /* ========================================================
     POLISHED GAMEPLAY SOUND EFFECTS
     ======================================================== */

  // Walking Footstep: Gentle, natural muffled step (non-fatiguing)
  playFootstep() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      const baseFreq = 95 + (Math.random() * 15 - 7);
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.065);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(170, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.006);
      gain.gain.linearRampToValueAtTime(0.0001, t + 0.065);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.065);
    } catch(e) {}
  }

  // Jump / Hop: Smooth upward whistle chime
  playJump() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.16);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch(e) {}
  }

  // Collecting Gold Coin: Crystalline dual chime with soft sparkle
  playCoin() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;

      // Fundamental chime 1: B5 (987.77 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, t);
      gain1.gain.setValueAtTime(0.0001, t);
      gain1.gain.linearRampToValueAtTime(0.14, t + 0.006);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc1.connect(gain1);
      gain1.connect(this.sfxGain);
      osc1.start(t);
      osc1.stop(t + 0.18);

      // Bell sparkle 2: E6 (1318.51 Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1318.51, t + 0.055);
      gain2.gain.setValueAtTime(0.0001, t + 0.055);
      gain2.gain.linearRampToValueAtTime(0.16, t + 0.065);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      osc2.connect(gain2);
      gain2.connect(this.sfxGain);
      osc2.start(t + 0.055);
      osc2.stop(t + 0.38);
    } catch(e) {}
  }

  // Collecting Magic Key: Celestial 5-note harp flourish
  playKey() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C5, E5, G5, B5, C6
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.20, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.55);
      });
    } catch(e) {}
  }

  // Unlocking Exit Portal: Resonant mystic chord sweep
  playUnlockExit() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130.81, t);
      osc.frequency.exponentialRampToValueAtTime(523.25, t + 0.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, t);
      filter.frequency.exponentialRampToValueAtTime(2800, t + 0.55);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.75);
    } catch(e) {}
  }

  // Level Complete: Heartwarming victory fanfare
  playLevelComplete() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const melody = [
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.14 },
        { f: 1046.50, d: 0.22 },
        { f: 880.00, d: 0.14 },
        { f: 1046.50, d: 0.50 }
      ];

      let curTime = this.ctx.currentTime;
      melody.forEach(item => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, curTime);

        gain.gain.setValueAtTime(0.0001, curTime);
        gain.gain.linearRampToValueAtTime(0.24, curTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, curTime + item.d);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(curTime);
        osc.stop(curTime + item.d);
        curTime += item.d * 0.82;
      });
    } catch(e) {}
  }

  // Hazard Hit: Comical soft cartoon bonk (smooth and non-jarring)
  playHazard() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + 0.24);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
      gain.gain.linearRampToValueAtTime(0.0001, t + 0.26);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.26);
    } catch(e) {}
  }

  // Checkpoint Saved: Soothing crystal chord
  playCheckpoint() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const chord = [440, 554.37, 659.25, 880]; // A Major harmonic
      chord.forEach((freq, idx) => {
        const t = this.ctx.currentTime + idx * 0.045;
        this.playSmoothTone(freq, 'sine', 0.01, 0.45, 0.12, this.sfxGain);
      });
    } catch(e) {}
  }

  // UI Click: Soft tactile tap
  playClick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.playSmoothTone(720, 'sine', 0.004, 0.035, 0.10, this.sfxGain);
  }

  // Shop Purchase: Warm dual bells
  playPurchase() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      this.playSmoothTone(1760, 'sine', 0.008, 0.22, 0.16, this.sfxGain);
      setTimeout(() => this.playSmoothTone(2637.02, 'sine', 0.008, 0.30, 0.18, this.sfxGain), 70);
    } catch(e) {}
  }
}

// Global audio singleton
window.audioManager = new AudioManager();
