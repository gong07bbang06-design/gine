/**
 * Procedural web audio generator for authentic school sounds & ASMR.
 * Avoids any static audio file download issues.
 */

class SoundGenerator {
  private ctx: AudioContext | null = null;
  private rainNode: AudioNode | null = null;
  private campfireNode: AudioNode | null = null;
  private libraryNode: AudioNode | null = null;
  private masterGain: GainNode | null = null;

  private rainGain: GainNode | null = null;
  private campfireGain: GainNode | null = null;
  private libraryGain: GainNode | null = null;

  constructor() {
    // Audio Context is initialized lazily upon first user interaction to satisfy browser autoplay security policies.
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Generates white noise buffer
   */
  private createNoiseBuffer(durationSeconds = 2.0): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const bufferSize = this.ctx.sampleRate * durationSeconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Generates brown/pink noise suitable for library hum or heavy rain
   */
  private createBrownNoiseBuffer(durationSeconds = 2.0): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const bufferSize = this.ctx.sampleRate * durationSeconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filter to create brown noise (accumulated low-pass)
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain compensation
    }
    return buffer;
  }

  /**
   * Plays the classic Korean school chime (딩-동-댕-동 딩-동-댕-동)
   */
  public playSchoolBell() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Notes for the chime: Sol-Do-Mi-Sol, La-La-Sol, etc.
    // Or a classic Westminster chime:
    // E4 (329.63), C4 (261.63), D4 (293.66), G3 (196.00)
    // C4 (261.63), E4 (329.63), D4 (293.66), G3 (196.00)
    
    // Classic simple chime: 
    // G4 (392Hz), C5 (523.25Hz), E5 (659.25Hz), G5 (784Hz) -> F5 (698.46Hz), D5 (587.33Hz), C5 (523.25Hz)
    const notes = [
      { f: 392.00, d: 0.4, t: 0.0 }, // G4
      { f: 523.25, d: 0.4, t: 0.4 }, // C5
      { f: 659.25, d: 0.4, t: 0.8 }, // E5
      { f: 784.00, d: 0.6, t: 1.2 }, // G5
      
      { f: 880.00, d: 0.4, t: 1.8 }, // A5
      { f: 880.00, d: 0.4, t: 2.2 }, // A5
      { f: 784.00, d: 0.7, t: 2.6 }, // G5
      
      { f: 659.25, d: 0.4, t: 3.4 }, // E5
      { f: 587.33, d: 0.4, t: 3.8 }, // D5
      { f: 523.25, d: 0.6, t: 4.2 }, // C5
    ];

    notes.forEach(note => {
      this.playTone(note.f, note.d, now + note.t);
    });
  }

  private playTone(frequency: number, duration: number, startTime: number) {
    if (!this.ctx || !this.masterGain) return;

    // We blend a sine wave (clean bell) and triangle wave (softer body) for a beautiful vibraphone/chime chime
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, startTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(frequency * 2, startTime); // Harmonic octave

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.05); // attack
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // decay

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc1.start(startTime);
    osc2.start(startTime);

    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }

  /**
   * Sound effect for feeding/tapping on the character
   */
  public playCrunch() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    
    // Low frequency organic crunch
    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    noise.buffer = this.createNoiseBuffer(0.15);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(3, now);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    osc.connect(gain);

    gain.connect(this.masterGain);

    noise.start(now);
    osc.start(now);
    noise.stop(now + 0.15);
    osc.stop(now + 0.15);
  }

  /**
   * Play warning blip for tab out / visibility violation
   */
  public playWarning() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(300, now + 0.1);
    osc.frequency.linearRampToValueAtTime(100, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Play target success fanfare on completion
   */
  public playSuccessFanfare() {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 784.00, 1046.50]; // C Major arpeggio
    notes.forEach((freq, idx) => {
      this.playTone(freq, 0.4, now + (idx * 0.08));
    });
  }

  /**
   * Start / Adjust Rain ASMR loop
   */
  public startRain(volume: number) {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    if (!this.rainNode) {
      // Create rain sound using low-passed white noise
      const bufferSource = this.ctx.createBufferSource();
      bufferSource.buffer = this.createNoiseBuffer(5.0);
      bufferSource.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.setValueAtTime(360, this.ctx.currentTime); // Lowered from 900 to keep continuous hiss ultra low and deep

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime); // fade in gracefully

      bufferSource.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.masterGain);

      bufferSource.start(0);
      this.rainNode = bufferSource;

      // Start the irregular micro-scheduler for individual raindrops hitting glass pane!
      this.scheduleRaindrops();
    }

    if (this.rainGain) {
      // Fade to desired volume smoothly (lower background hiss slightly to let individual taps shine)
      this.rainGain.gain.linearRampToValueAtTime(volume * 0.08, this.ctx.currentTime + 0.5);
    }
  }

  private scheduleRaindrops() {
    if (!this.rainNode || !this.ctx || !this.masterGain || !this.rainGain) return;

    const loop = () => {
      if (!this.rainNode || !this.ctx) return;
      const now = this.ctx.currentTime;
      const currentRainVolume = this.rainGain?.gain.value || 0;
      // If rain volume is on, schedule random crisp drop-taps
      if (currentRainVolume > 0.005) {
        const tapCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 droplets in a burst
        for (let i = 0; i < tapCount; i++) {
          const delay = i * (0.04 + Math.random() * 0.16);
          this.playWindowRaindrop(now + delay);
        }
      }
      // Dynamic intervals mimicking sudden small wind gusts shifting drops on the glass pane
      const nextTime = 120 + Math.random() * 380;
      setTimeout(loop, nextTime);
    };
    loop();
  }

  private playWindowRaindrop(startTime: number) {
    if (!this.ctx || !this.masterGain || !this.rainGain) return;

    const currentVol = this.rainGain.gain.value;

    // 1. High frequency wet rain contact slap (the water drop splash on glass)
    const splash = this.ctx.createBufferSource();
    splash.buffer = this.createNoiseBuffer(0.02);

    const highFilter = this.ctx.createBiquadFilter();
    highFilter.type = 'bandpass';
    highFilter.frequency.setValueAtTime(2300 + Math.random() * 1250, startTime);
    highFilter.Q.setValueAtTime(9, startTime); // Resonant point to sound like wet glass tapping

    const splashGain = this.ctx.createGain();
    splashGain.gain.setValueAtTime(0, startTime);
    splashGain.gain.linearRampToValueAtTime(0.08 * currentVol, startTime + 0.001);
    splashGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.016 + Math.random() * 0.008);

    // 2. Glass frame low-vibration thud (the structural thud of raindrop meeting glass)
    const glassThumper = this.ctx.createOscillator();
    glassThumper.type = 'sine';
    glassThumper.frequency.setValueAtTime(130 + Math.random() * 50, startTime);
    glassThumper.frequency.exponentialRampToValueAtTime(45, startTime + 0.03);

    const thumpGain = this.ctx.createGain();
    thumpGain.gain.setValueAtTime(0, startTime);
    thumpGain.gain.linearRampToValueAtTime(0.05 * currentVol, startTime + 0.001);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.05);

    // Wire up
    splash.connect(highFilter);
    highFilter.connect(splashGain);
    splashGain.connect(this.masterGain);

    glassThumper.connect(thumpGain);
    thumpGain.connect(this.masterGain);

    splash.start(startTime);
    splash.stop(startTime + 0.03);

    glassThumper.start(startTime);
    glassThumper.stop(startTime + 0.06);
  }

  public stopRain() {
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      setTimeout(() => {
        if (this.rainNode) {
          try {
            (this.rainNode as AudioBufferSourceNode).stop();
          } catch(e) {}
          this.rainNode = null;
        }
      }, 600);
    }
  }

  /**
   * Start / Adjust Campfire ASMR loop
   */
  public startCampfire(volume: number) {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    if (!this.campfireNode) {
      // Campfire is low-frequency rumble mixed with high frequencies popping
      const bufferSource = this.ctx.createBufferSource();
      bufferSource.buffer = this.createBrownNoiseBuffer(4.0);
      bufferSource.loop = true;

      const campfireFilter = this.ctx.createBiquadFilter();
      campfireFilter.type = 'lowpass';
      campfireFilter.frequency.setValueAtTime(160, this.ctx.currentTime); // lowered from 350 to keep rumble ultra-deep & cozy, avoiding wind noise

      this.campfireGain = this.ctx.createGain();
      this.campfireGain.gain.setValueAtTime(0, this.ctx.currentTime);

      bufferSource.connect(campfireFilter);
      campfireFilter.connect(this.campfireGain);
      this.campfireGain.connect(this.masterGain);

      bufferSource.start(0);
      this.campfireNode = bufferSource;

      // Start campfire crackle schedule
      this.scheduleCampfireCrackles();
    }

    if (this.campfireGain) {
      this.campfireGain.gain.linearRampToValueAtTime(volume * 0.18, this.ctx.currentTime + 0.5); // reduced from 0.5 to keep backdrop quiet
    }
  }

  private scheduleCampfireCrackles() {
    if (!this.campfireNode || !this.ctx || !this.masterGain || !this.campfireGain) return;

    const loop = () => {
      if (!this.campfireNode || !this.ctx) return;
      const now = this.ctx.currentTime;
      // Trigger a pop/crackle
      const currentCampVolume = this.campfireGain?.gain.value || 0;
      if (currentCampVolume > 0.01) {
        this.playCampfireCrackle(now);
        // Play multiple tiny rapid sub-crackles for authentic wood splitting texture
        if (Math.random() < 0.35) {
          this.playCampfireCrackle(now + 0.008 + Math.random() * 0.02);
        }
      }
      const nextTime = 150 + Math.random() * 700; // dynamic, organic crackling interval
      setTimeout(loop, nextTime);
    };
    loop();
  }

  private playCampfireCrackle(startTime: number) {
    if (!this.ctx || !this.masterGain || !this.campfireGain) return;
    
    // Quick procedural crackling pop using noise bandpassed with high resonance (Q)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.04);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500 + Math.random() * 2500, startTime); // snap/clatter frequencies
    filter.Q.setValueAtTime(12 + Math.random() * 10, startTime); // very high Q creates a crisp, resonant "wooden pop"

    const gainNode = this.ctx.createGain();
    const currentVol = this.campfireGain.gain.value;
    gainNode.gain.setValueAtTime(0, startTime);
    // Dynamic organic snapping intensity
    gainNode.gain.linearRampToValueAtTime(0.28 * currentVol, startTime + 0.001);
    gainNode.gain.linearRampToValueAtTime(0.08 * currentVol, startTime + 0.004);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.012 + Math.random() * 0.015);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    noise.start(startTime);
    noise.stop(startTime + 0.04);
  }

  public stopCampfire() {
    if (this.campfireGain && this.ctx) {
      this.campfireGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      setTimeout(() => {
        if (this.campfireNode) {
          try {
            (this.campfireNode as AudioBufferSourceNode).stop();
          } catch(e) {}
          this.campfireNode = null;
        }
      }, 600);
    }
  }

  /**
   * Start / Adjust Library ASMR loop
   */
  public startLibrary(volume: number) {
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    if (!this.libraryNode) {
      // Library sounds are deep brown noise as draft air conditioning + occasional pages rolling
      const bufferSource = this.ctx.createBufferSource();
      bufferSource.buffer = this.createBrownNoiseBuffer(6.0);
      bufferSource.loop = true;

      const libraryFilter = this.ctx.createBiquadFilter();
      libraryFilter.type = 'lowpass';
      libraryFilter.frequency.setValueAtTime(115, this.ctx.currentTime); // deep ventilation hum, lowered from 150
      libraryFilter.Q.setValueAtTime(2.5, this.ctx.currentTime); // adds cozy physical indoor ventilation resonance

      this.libraryGain = this.ctx.createGain();
      this.libraryGain.gain.setValueAtTime(0, this.ctx.currentTime);

      bufferSource.connect(libraryFilter);
      libraryFilter.connect(this.libraryGain);
      this.libraryGain.connect(this.masterGain);

      bufferSource.start(0);
      this.libraryNode = bufferSource;

      // Start paper ruffling schedules
      this.scheduleLibraryPages();
    }

    if (this.libraryGain) {
      this.libraryGain.gain.linearRampToValueAtTime(volume * 0.65, this.ctx.currentTime + 0.5); // increased from 0.12 to keep air conditioner prominent as requested
    }
  }

  private scheduleLibraryPages() {
    if (!this.libraryNode || !this.ctx || !this.masterGain || !this.libraryGain) return;

    const loop = () => {
      if (!this.libraryNode || !this.ctx) return;
      const now = this.ctx.currentTime;
      const currentLibVolume = this.libraryGain?.gain.value || 0;
      if (currentLibVolume > 0.01 && Math.random() < 0.45) {
        this.playPageRuffle(now);
      }
      const nextTime = 4000 + Math.random() * 8000; // Pages turn occasionally
      setTimeout(loop, nextTime);
    };
    loop();
  }

  private playPageRuffle(startTime: number) {
    if (!this.ctx || !this.masterGain || !this.libraryGain) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, startTime);
    filter.Q.setValueAtTime(1.5, startTime);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.012 * this.libraryGain.gain.value, startTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.004 * this.libraryGain.gain.value, startTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    noise.start(startTime);
    noise.stop(startTime + 0.4);
  }

  public stopLibrary() {
    if (this.libraryGain && this.ctx) {
      this.libraryGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
      setTimeout(() => {
        if (this.libraryNode) {
          try {
            (this.libraryNode as AudioBufferSourceNode).stop();
          } catch(e) {}
          this.libraryNode = null;
        }
      }, 600);
    }
  }

  /**
   * Stop all ASMR sounds
   */
  public stopAllASMR() {
    this.stopRain();
    this.stopCampfire();
    this.stopLibrary();
  }
}

export const sound = new SoundGenerator();
