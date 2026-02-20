// SoundManager - Web Audio API based sound system with cute MIDI-style sounds
// Uses synthesized sounds that are easy to replace with audio files later

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private isMusicPlaying: boolean = false;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;

  // Lazy initialization (required for browsers that need user interaction)
  private ensureContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);

      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = 0.3;
      this.sfxGain.connect(this.masterGain);
    }

    // Resume if suspended (autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    return this.audioContext;
  }

  // Play a simple tone with envelope
  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainNode: GainNode | null = null,
    detune: number = 0,
  ): void {
    const ctx = this.ensureContext();
    const target = gainNode || this.sfxGain!;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = detune;

    // Soft envelope with gentler attack
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.04);
    env.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(env);
    env.connect(target);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  // Play a sequence of notes
  private playSequence(
    notes: { freq: number; dur: number; delay: number }[],
    type: OscillatorType = 'sine',
  ): void {
    if (!this.sfxEnabled) return;

    const ctx = this.ensureContext();

    for (const note of notes) {
      setTimeout(() => {
        this.playTone(note.freq, note.dur, type, this.sfxGain);
      }, note.delay * 1000);
    }
  }

  // === SOUND EFFECTS ===

  // Frog hop - soft chirp
  playHop(): void {
    if (!this.sfxEnabled) return;

    // Gentle ascending two-note chirp
    this.playTone(440, 0.1, 'sine', this.sfxGain);
    setTimeout(() => {
      this.playTone(587, 0.12, 'sine', this.sfxGain);
    }, 50);
  }

  // Player joined - friendly welcoming sound
  playPlayerJoined(): void {
    if (!this.sfxEnabled) return;

    // Ascending arpeggio - welcoming feel
    this.playSequence(
      [
        { freq: 523, dur: 0.12, delay: 0 }, // C5
        { freq: 659, dur: 0.12, delay: 0.08 }, // E5
        { freq: 784, dur: 0.15, delay: 0.16 }, // G5
      ],
      'triangle',
    );
  }

  // Game start - gentle upbeat sound
  playGameStart(): void {
    if (!this.sfxEnabled) return;

    // Soft fanfare
    this.playSequence(
      [
        { freq: 392, dur: 0.15, delay: 0 }, // G4
        { freq: 523, dur: 0.15, delay: 0.12 }, // C5
        { freq: 659, dur: 0.15, delay: 0.24 }, // E5
        { freq: 784, dur: 0.25, delay: 0.36 }, // G5
      ],
      'sine',
    );
  }

  // Game restart - similar but softer
  playRestart(): void {
    if (!this.sfxEnabled) return;

    this.playSequence(
      [
        { freq: 392, dur: 0.08, delay: 0 }, // G4
        { freq: 494, dur: 0.08, delay: 0.08 }, // B4
        { freq: 587, dur: 0.15, delay: 0.16 }, // D5
      ],
      'triangle',
    );
  }

  // Death sound - soft descending tone
  playDeath(): void {
    if (!this.sfxEnabled) return;

    this.playSequence(
      [
        { freq: 440, dur: 0.18, delay: 0 }, // A4
        { freq: 370, dur: 0.18, delay: 0.15 }, // F#4
        { freq: 294, dur: 0.3, delay: 0.3 }, // D4
      ],
      'triangle',
    );
  }

  // Victory sound - gentle triumphant melody
  playVictory(): void {
    if (!this.sfxEnabled) return;

    this.playSequence(
      [
        { freq: 523, dur: 0.15, delay: 0 }, // C5
        { freq: 659, dur: 0.15, delay: 0.12 }, // E5
        { freq: 784, dur: 0.15, delay: 0.24 }, // G5
        { freq: 1047, dur: 0.35, delay: 0.36 }, // C6
      ],
      'triangle',
    );
  }

  // === BACKGROUND MUSIC ===

  // Gentle looping background music
  startMusic(): void {
    if (!this.musicEnabled || this.isMusicPlaying) return;

    const ctx = this.ensureContext();
    this.isMusicPlaying = true;

    // Simple gentle melody pattern - pentatonic for pleasant sound
    const melody = [
      392,
      440,
      523,
      587,
      659,
      587,
      523,
      440, // G4, A4, C5, D5, E5, D5, C5, A4
      392,
      330,
      392,
      440,
      523,
      440,
      392,
      330, // G4, E4, G4, A4, C5, A4, G4, E4
    ];

    const playMelodyNote = (index: number) => {
      if (!this.isMusicPlaying) return;

      const noteIndex = index % melody.length;
      const freq = melody[noteIndex];

      // Main melody note
      const osc = ctx.createOscillator();
      const env = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      // Soft, gentle envelope
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      env.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(env);
      env.connect(this.musicGain!);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);

      // Add a soft bass note every 4 beats
      if (noteIndex % 4 === 0) {
        const bassOsc = ctx.createOscillator();
        const bassEnv = ctx.createGain();

        bassOsc.type = 'sine';
        bassOsc.frequency.value = freq / 2;

        bassEnv.gain.setValueAtTime(0, ctx.currentTime);
        bassEnv.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.03);
        bassEnv.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        bassOsc.connect(bassEnv);
        bassEnv.connect(this.musicGain!);

        bassOsc.start(ctx.currentTime);
        bassOsc.stop(ctx.currentTime + 0.55);
      }

      // Schedule next note
      setTimeout(() => playMelodyNote(index + 1), 350);
    };

    playMelodyNote(0);
  }

  stopMusic(): void {
    this.isMusicPlaying = false;
    // Oscillators will naturally stop when their scheduled time ends
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.musicEnabled;
  }

  toggleSfx(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  setMusicVolume(volume: number): void {
    if (this.musicGain) {
      this.musicGain.gain.value = Math.max(0, Math.min(1, volume)) * 0.15;
    }
  }

  setSfxVolume(volume: number): void {
    if (this.sfxGain) {
      this.sfxGain.gain.value = Math.max(0, Math.min(1, volume)) * 0.4;
    }
  }

  // Call on first user interaction to unlock audio
  unlock(): void {
    this.ensureContext();
  }
}

// Singleton instance
export const soundManager = new SoundManager();
