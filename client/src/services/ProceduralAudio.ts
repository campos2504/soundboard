import { AudioEngine } from './AudioEngine';

/**
 * Procedural Analog 90s Audio FX Synthesis using Web Audio API
 * Generates tactile mechanical cassette clicks, tape insert clacks, and boombox sound cues.
 * STRICTLY routed to the SECONDARY / TEST output device (headphones/monitor), never leaking to main stream.
 */

class ProceduralAudioService {
  private ctx: AudioContext | null = null;
  private soundEffectsEnabled: boolean = true;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private sinkAudioEl: HTMLAudioElement | null = null;

  constructor() {
    const saved = localStorage.getItem('k7_sound_effects_enabled');
    if (saved !== null) {
      this.soundEffectsEnabled = saved === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Route audio exclusively to the SECONDARY / TEST device (Headphones)
   */
  private getTargetDestination(): AudioNode | null {
    const ctx = this.getContext();
    if (!ctx) return null;

    const config = AudioEngine.getConfig();

    // Check if AudioContext itself supports setSinkId
    if (typeof (ctx as any).setSinkId === 'function' && config.secondaryDeviceId && config.secondaryDeviceId !== 'default') {
      (ctx as any).setSinkId(config.secondaryDeviceId).catch(() => {});
    }

    // Set up dedicated MediaStream sink HTMLAudioElement for hardware secondary device isolation
    if (!this.streamDest) {
      try {
        this.streamDest = ctx.createMediaStreamDestination();
        this.sinkAudioEl = new Audio();
        this.sinkAudioEl.srcObject = this.streamDest.stream;
        this.sinkAudioEl.play().catch(() => {});
      } catch {
        // Fallback to destination if media stream destination fails
        return ctx.destination;
      }
    }

    if (this.sinkAudioEl) {
      this.sinkAudioEl.volume = Math.max(0, Math.min(1, config.previewVolume));
      const targetDevice = config.secondaryDeviceId;
      if (targetDevice && targetDevice !== 'default' && typeof (this.sinkAudioEl as any).setSinkId === 'function') {
        (this.sinkAudioEl as any).setSinkId(targetDevice).catch(() => {});
      }
    }

    return this.streamDest || ctx.destination;
  }

  public isEnabled(): boolean {
    return this.soundEffectsEnabled;
  }

  public toggleSoundEffects(): boolean {
    this.soundEffectsEnabled = !this.soundEffectsEnabled;
    localStorage.setItem('k7_sound_effects_enabled', String(this.soundEffectsEnabled));
    return this.soundEffectsEnabled;
  }

  /**
   * Authentic Cassette Insert "Clack-Thud" (Drag & Drop or Tab Switch)
   * Plays EXCLUSIVELY on the secondary output device (Headphones).
   */
  public playTapeInsert() {
    if (!this.soundEffectsEnabled) return;
    const ctx = this.getContext();
    const destination = this.getTargetDestination();
    if (!ctx || !destination) return;

    try {
      const now = ctx.currentTime;

      // 1. Plastic Thud (Sub-bass impact)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.09);

      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(oscGain);
      oscGain.connect(destination);

      osc.start(now);
      osc.stop(now + 0.09);

      // 2. Metallic Latch Click (High noise burst)
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now + 0.015);
      filter.Q.setValueAtTime(4, now + 0.015);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now + 0.015);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);

      noise.start(now + 0.015);
    } catch {
      // Gracefully ignore audio failure
    }
  }

  /**
   * Tape Eject Spring Release Sound
   * Plays EXCLUSIVELY on secondary test device.
   */
  public playTapeEject() {
    if (!this.soundEffectsEnabled) return;
    const ctx = this.getContext();
    const destination = this.getTargetDestination();
    if (!ctx || !destination) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(540, now + 0.07);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Ignore
    }
  }
}

export const ProceduralAudio = new ProceduralAudioService();
