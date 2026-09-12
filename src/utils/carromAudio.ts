/**
 * Carrom Board Dynamic Acoustic Audio Engine & Sound Replacer
 * Provides realistic physical modeling of wooden carrom boards,
 * striker snaps, piece-to-piece collisions, cushion bounces, and pocket drops.
 * Supports swappable sound themes (Classic Wood, Tournament Pro, Arcade Crystal, Retro Tactile, Custom).
 */

export type CarromSoundTheme = 'classic' | 'tournament' | 'arcade' | 'retro' | 'synth' | 'custom';

export interface CarromSoundSettings {
  theme: CarromSoundTheme;
  volume: number; // 0 to 1
  pitchScale: number; // 0.6 to 1.5
  woodResonance: number; // 0.5 to 2.0
  enabled: boolean;
}

const DEFAULT_SETTINGS: CarromSoundSettings = {
  theme: 'classic',
  volume: 0.85,
  pitchScale: 1.0,
  woodResonance: 1.0,
  enabled: true,
};

const STORAGE_KEY = 'carrom_board_sound_preferences_v2';

export class CarromAudioEngine {
  private ctx: AudioContext | null = null;
  private settings: CarromSoundSettings = { ...DEFAULT_SETTINGS };
  private lastClackTime: number = 0;
  private lastBounceTime: number = 0;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  public saveSettings(newSettings: Partial<CarromSoundSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      } catch {
        // ignore quota issues
      }
    }
  }

  public getSettings(): CarromSoundSettings {
    return { ...this.settings };
  }

  public getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // 1. STRIKER RELEASE / FLICK
  // Simulates fingertip flicking the heavy acrylic striker with a sharp snap and surface glide
  public playStrikerRelease(powerPercent: number = 50) {
    if (!this.settings.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const normalizedPwr = Math.max(0.15, Math.min(1.0, powerPercent / 100));
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.settings.volume * 0.7, now);
      masterGain.connect(ctx.destination);

      const pitch = this.settings.pitchScale;

      if (this.settings.theme === 'arcade') {
        // Futuristic energy release
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(1400 * pitch, now + 0.08);
        g.gain.setValueAtTime(0.4 * normalizedPwr, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.12);
        return;
      }

      if (this.settings.theme === 'retro') {
        // 8-bit crisp blip
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220 * pitch, now);
        osc.frequency.setValueAtTime(440 * pitch, now + 0.03);
        g.gain.setValueAtTime(0.3 * normalizedPwr, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.07);
        return;
      }

      // Classic Wood & Tournament Pro - Authentic Fingertip Snap + Wooden Slide
      const baseFreq = this.settings.theme === 'tournament' ? 480 : 380;
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();

      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(baseFreq * pitch * (0.9 + normalizedPwr * 0.3), now);
      snapOsc.frequency.exponentialRampToValueAtTime(60 * pitch, now + 0.045);

      snapGain.gain.setValueAtTime((0.35 + normalizedPwr * 0.45), now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      snapOsc.connect(snapGain);
      snapGain.connect(masterGain);

      snapOsc.start(now);
      snapOsc.stop(now + 0.05);

      // Powder whisper / sliding air friction noise burst
      const bufferSize = Math.floor(ctx.sampleRate * 0.06);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800 * pitch, now);
      filter.Q.setValueAtTime(3.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18 * normalizedPwr, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.06);
    } catch {
      // Audio fallback
    }
  }

  // 2. COIN-TO-COIN & STRIKER-TO-COIN IMPACT (CLACK)
  // Replaces the annoying buzzer/chess check with authentic wooden piece impact
  public playCoinClack(relativeVelocity: number = 5) {
    if (!this.settings.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Rate limiter to prevent sound stutter on simultaneous clusters
    const now = ctx.currentTime;
    if (now - this.lastClackTime < 0.022) return;
    this.lastClackTime = now;

    try {
      const speed = Math.max(0.2, Math.min(1.0, relativeVelocity / 12));
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.settings.volume * (0.2 + speed * 0.6), now);
      masterGain.connect(ctx.destination);

      const pitch = this.settings.pitchScale;
      const res = this.settings.woodResonance;

      if (this.settings.theme === 'synth') {
        // Pure Web Audio API Synthesizer (carrom_game.js specification)
        // Sharp wooden click sound with exponential frequency ramp and gain envelope
        const intensity = Math.max(0.2, Math.min(2.0, speed * 1.6));
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400 * intensity * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(100 * pitch, now + 0.05);
        g.gain.setValueAtTime(Math.min(intensity, 1), now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.05);
        return;
      }

      if (this.settings.theme === 'arcade') {
        // Neon crystal ping
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1850 * pitch + Math.random() * 150, now);
        osc.frequency.exponentialRampToValueAtTime(400 * pitch, now + 0.04);
        g.gain.setValueAtTime(0.5 * speed, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.045);
        return;
      }

      if (this.settings.theme === 'retro') {
        // Punchy 8-bit click
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880 * pitch, now);
        osc.frequency.setValueAtTime(220 * pitch, now + 0.02);
        g.gain.setValueAtTime(0.4 * speed, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.03);
        return;
      }

      // Classic Wood / Tournament Pro / Custom:
      // High transient strike + mid wooden resonance body
      const randDetune = (Math.random() - 0.5) * 40;
      const baseFreq = (this.settings.theme === 'tournament' ? 1420 : 1180) * pitch + randDetune;

      // Primary click transient
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(baseFreq, now);
      clickOsc.frequency.exponentialRampToValueAtTime(260 * pitch, now + 0.028);

      clickGain.gain.setValueAtTime(0.6 * speed, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

      clickOsc.connect(clickGain);
      clickGain.connect(masterGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.028);

      // Wooden body tone
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'sine';
      bodyOsc.frequency.setValueAtTime((baseFreq * 0.42), now);
      bodyOsc.frequency.exponentialRampToValueAtTime(110, now + 0.04 * res);

      bodyGain.gain.setValueAtTime(0.35 * speed * res, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04 * res);

      bodyOsc.connect(bodyGain);
      bodyGain.connect(masterGain);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.04 * res);
    } catch {
      // Audio fallback
    }
  }

  // 3. CUSHION / WOODEN RIM BOUNCE
  // Deep wooden edge rebound thud
  public playRimBounce(velocity: number = 5) {
    if (!this.settings.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (now - this.lastBounceTime < 0.03) return;
    this.lastBounceTime = now;

    try {
      const speed = Math.max(0.2, Math.min(1.0, velocity / 10));
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.settings.volume * (0.25 + speed * 0.5), now);
      masterGain.connect(ctx.destination);

      const pitch = this.settings.pitchScale;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = this.settings.theme === 'arcade' ? 'triangle' : 'sine';
      const startF = (this.settings.theme === 'tournament' ? 240 : 190) * pitch;
      osc.frequency.setValueAtTime(startF, now);
      osc.frequency.exponentialRampToValueAtTime(65 * pitch, now + 0.055);

      gain.gain.setValueAtTime(0.5 * speed, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.055);
    } catch {
      // Audio fallback
    }
  }

  // 4. POCKET SINK / DROP INTO NET
  // Deep hollow thud into cotton pocket net with coin settling
  public playPocketSink(pieceType: 'white' | 'black' | 'queen' = 'white') {
    if (!this.settings.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.settings.volume, now);
      masterGain.connect(ctx.destination);

      const pitch = this.settings.pitchScale;

      if (this.settings.theme === 'synth') {
        // Pure Web Audio API Synthesizer (carrom_game.js specification)
        // Deeper wooden thud sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(40 * pitch, now + 0.15);
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        return;
      }

      // Net thud (low sine drop)
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(160 * pitch, now);
      thudOsc.frequency.exponentialRampToValueAtTime(45 * pitch, now + 0.12);

      thudGain.gain.setValueAtTime(0.5, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      thudOsc.connect(thudGain);
      thudGain.connect(masterGain);
      thudOsc.start(now);
      thudOsc.stop(now + 0.12);

      // If Queen is pocketed: special royal celebratory harmonic chime!
      if (pieceType === 'queen') {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const qOsc = ctx.createOscillator();
          const qGain = ctx.createGain();
          qOsc.type = 'triangle';
          qOsc.frequency.setValueAtTime(freq * pitch, now + idx * 0.05);

          qGain.gain.setValueAtTime(0.3, now + idx * 0.05);
          qGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

          qOsc.connect(qGain);
          qGain.connect(masterGain);
          qOsc.start(now + idx * 0.05);
          qOsc.stop(now + idx * 0.05 + 0.25);
        });
      } else {
        // Second subtle coin settle clink in pocket
        const clinkOsc = ctx.createOscillator();
        const clinkGain = ctx.createGain();
        clinkOsc.type = 'triangle';
        clinkOsc.frequency.setValueAtTime(650 * pitch, now + 0.04);
        clinkOsc.frequency.exponentialRampToValueAtTime(200 * pitch, now + 0.09);

        clinkGain.gain.setValueAtTime(0.2, now + 0.04);
        clinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        clinkOsc.connect(clinkGain);
        clinkGain.connect(masterGain);
        clinkOsc.start(now + 0.04);
        clinkOsc.stop(now + 0.09);
      }
    } catch {
      // Audio fallback
    }
  }

  // 5. FOUL PENALTY
  // Damped low buzz / foul sound when striker pocketed or foul occurs
  public playFoulPenalty() {
    if (!this.settings.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.settings.volume * 0.7, now);
      masterGain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(100, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Audio fallback
    }
  }

  // 6. VICTORY FANFARE
  public playVictoryFanfare() {
    if (!this.settings.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.settings.volume * 0.8, now);
      masterGain.connect(ctx.destination);

      const notes = [392.0, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.35, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.35);
      });
    } catch {
      // Audio fallback
    }
  }
}

export const carromAudio = new CarromAudioEngine();
