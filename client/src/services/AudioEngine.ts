import type { AudioOutputDevice, AudioRoutingConfig } from '../types';
import { getAudioProxyUrl } from './api';

export type PlayingStateCallback = (playingIds: Set<string>, activeTests: Set<string>) => void;

function generateChimeWav(isSecondary: boolean = false): string {
  const sampleRate = 44100;
  const duration = 0.55;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Uint8Array(44 + numSamples * 2);
  const view = new DataView(buffer.buffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + numSamples * 2, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, numSamples * 2, true);

  // Secondary uses higher alert frequencies (880Hz + 1320Hz) vs Primary (587Hz + 880Hz)
  const f1 = isSecondary ? 784.0 : 587.33;
  const f2 = isSecondary ? 1046.5 : 880.0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.max(0, 1 - t / duration) * (t < 0.01 ? t / 0.01 : 1);
    const freq = t < 0.2 ? f1 : f2;
    const sample = Math.sin(2 * Math.PI * freq * t) * env * 0.45;
    const intSample = Math.floor(sample * 32767);
    view.setInt16(44 + i * 2, intSample, true);
  }

  // Browser Base64 encoding
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

class AudioEngineService {
  private activeAudios: Map<string, { element: HTMLAudioElement; isTest: boolean }> = new Map();
  private playingSoundIds: Set<string> = new Set();
  private activeTestSoundIds: Set<string> = new Set();
  private stateListeners: Set<PlayingStateCallback> = new Set();
  private simulatedVisualizerData: Uint8Array = new Uint8Array(32);

  private config: AudioRoutingConfig = {
    primaryDeviceId: 'default',
    primaryDeviceLabel: 'Padrão do Sistema (Auto-falantes / VB-Cable)',
    secondaryDeviceId: 'default',
    secondaryDeviceLabel: 'Padrão do Sistema (Fones / Preview)',
    masterVolume: 1.0,
    previewVolume: 1.0,
    dualOutputEnabled: false,
    overlapMode: 'cut',
  };

  constructor() {
    this.loadConfigFromStorage();
  }

  private loadConfigFromStorage() {
    try {
      const stored = localStorage.getItem('steamdeck_audio_config');
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Could not load audio config from localStorage', e);
    }
  }

  public saveConfig(newConfig: Partial<AudioRoutingConfig>) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem('steamdeck_audio_config', JSON.stringify(this.config));
    } catch (e) {
      console.warn('Could not save audio config', e);
    }
  }

  public getConfig(): AudioRoutingConfig {
    return { ...this.config };
  }

  public isPlayingAny(): boolean {
    return this.playingSoundIds.size > 0 || this.activeTestSoundIds.size > 0;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.isPlayingAny()) {
      this.simulatedVisualizerData.fill(0);
      return this.simulatedVisualizerData;
    }

    // Dynamic reactive frequency spectrum generator for visualizer
    const time = performance.now() * 0.005;
    for (let i = 0; i < this.simulatedVisualizerData.length; i++) {
      const wave = Math.sin(time * 2 + i * 0.4) * 0.5 + 0.5;
      const noise = (Math.sin(time * 5 + i * 1.2) * 0.3 + 0.7);
      const intensity = Math.min(255, Math.floor((wave * noise * 180) + 75));
      this.simulatedVisualizerData[i] = intensity;
    }
    return this.simulatedVisualizerData;
  }

  public subscribe(callback: PlayingStateCallback): () => void {
    this.stateListeners.add(callback);
    callback(new Set(this.playingSoundIds), new Set(this.activeTestSoundIds));
    return () => this.stateListeners.delete(callback);
  }

  private notifyListeners() {
    const playings = new Set(this.playingSoundIds);
    const tests = new Set(this.activeTestSoundIds);
    for (const listener of this.stateListeners) {
      listener(playings, tests);
    }
  }

  /**
   * Enumerate available output devices. Requests audio permission if necessary to unlock labels & hardware routing.
   */
  public async getAvailableOutputDevices(forcePrompt: boolean = false): Promise<AudioOutputDevice[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [{ deviceId: 'default', label: 'Dispositivo Padrão do Sistema', groupId: '' }];
      }

      if (forcePrompt) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch (err) {
          console.warn('Microphone permission request error:', err);
        }
      }

      let devices = await navigator.mediaDevices.enumerateDevices();
      const hasOutputWithLabel = devices.some((d) => d.kind === 'audiooutput' && d.label.length > 0);

      if (!hasOutputWithLabel && !forcePrompt) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
          devices = await navigator.mediaDevices.enumerateDevices();
        } catch (err) {
          console.warn('Permission not granted yet, showing available devices without labels', err);
        }
      }

      const outputDevices = devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d, index) => ({
          deviceId: d.deviceId || 'default',
          label: d.label || (d.deviceId === 'default' ? 'Padrão do Sistema' : `Saída de Áudio ${index + 1}`),
          groupId: d.groupId || '',
        }));

      if (outputDevices.length === 0) {
        outputDevices.push({
          deviceId: 'default',
          label: 'Padrão do Sistema (Auto-falantes)',
          groupId: '',
        });
      }

      return outputDevices;
    } catch (e) {
      console.error('Error enumerating audio devices:', e);
      return [{ deviceId: 'default', label: 'Dispositivo Padrão', groupId: '' }];
    }
  }

  /**
   * Main Play function
   * @param sound The SoundItem or partial sound object to play
   * @param isTestPreview If TRUE, routes to the SECONDARY / TEST output device (Test Pill)
   */
  public async play(
    sound: { id: string; url: string; volume?: number; playbackRate?: number; title?: string },
    isTestPreview: boolean = false
  ): Promise<void> {
    // STRICT MUTUAL EXCLUSIVITY: Stop any and all existing audio across the entire app
    this.stopAll();

    const soundKey = isTestPreview ? `test_${sound.id}` : sound.id;

    const streamUrl = getAudioProxyUrl(sound.url);
    const audio = new Audio(streamUrl);

    const baseVol = sound.volume !== undefined ? sound.volume : 1.0;
    const masterVol = isTestPreview ? this.config.previewVolume : this.config.masterVolume;
    audio.volume = Math.max(0, Math.min(1, baseVol * masterVol));

    if (sound.playbackRate && sound.playbackRate > 0) {
      audio.playbackRate = sound.playbackRate;
    }

    // CRITICAL: Determine target output device ID
    const targetDeviceId = isTestPreview
      ? this.config.secondaryDeviceId
      : this.config.primaryDeviceId;

    // Apply setSinkId directly to the HTMLAudioElement
    if (targetDeviceId && targetDeviceId !== 'default' && typeof (audio as any).setSinkId === 'function') {
      try {
        await (audio as any).setSinkId(targetDeviceId);
        console.log(`[AudioEngine] Routed sound "${sound.title || sound.id}" to device "${targetDeviceId}" (isTest: ${isTestPreview})`);
      } catch (err: any) {
        console.warn(`[AudioEngine] Could not setSinkId to ${targetDeviceId}:`, err.message);
      }
    } else {
      console.log(`[AudioEngine] Playing sound "${sound.title || sound.id}" to default sink (isTest: ${isTestPreview})`);
    }

    this.activeAudios.set(soundKey, { element: audio, isTest: isTestPreview });
    if (isTestPreview) {
      this.activeTestSoundIds.add(sound.id);
    } else {
      this.playingSoundIds.add(sound.id);
    }
    this.notifyListeners();

    audio.onended = () => {
      this.cleanupSound(sound.id, soundKey, isTestPreview);
    };

    let hasTriedFallback = false;
    audio.onerror = async (e) => {
      console.warn(`[AudioEngine] Stream proxy error for ${sound.title || sound.id}, attempting direct playback...`, e);
      if (!hasTriedFallback && sound.url && sound.url !== streamUrl) {
        hasTriedFallback = true;
        try {
          audio.removeAttribute('crossorigin');
          audio.src = sound.url;
          await audio.play();
          return;
        } catch (retryErr) {
          console.error('[AudioEngine] Fallback play failed:', retryErr);
        }
      }
      this.cleanupSound(sound.id, soundKey, isTestPreview);
    };

    try {
      await audio.play();
    } catch (err: any) {
      console.error('[AudioEngine] Audio play failed:', err.message);
      this.cleanupSound(sound.id, soundKey, isTestPreview);
    }

    // Dual output feature: If enabled and playing main, also play clone to secondary device
    if (
      this.config.dualOutputEnabled &&
      !isTestPreview &&
      this.config.secondaryDeviceId !== this.config.primaryDeviceId
    ) {
      this.playSecondaryClone(sound, streamUrl, baseVol);
    }
  }

  private async playSecondaryClone(sound: any, streamUrl: string, baseVol: number) {
    try {
      const cloneKey = `dual_${sound.id}`;
      const cloneAudio = new Audio();
      cloneAudio.crossOrigin = 'anonymous';
      cloneAudio.src = streamUrl;
      cloneAudio.volume = Math.max(0, Math.min(1, baseVol * this.config.previewVolume));
      if (sound.playbackRate) cloneAudio.playbackRate = sound.playbackRate;

      if (
        this.config.secondaryDeviceId &&
        this.config.secondaryDeviceId !== 'default' &&
        typeof (cloneAudio as any).setSinkId === 'function'
      ) {
        await (cloneAudio as any).setSinkId(this.config.secondaryDeviceId);
      }

      this.activeAudios.set(cloneKey, { element: cloneAudio, isTest: false });
      cloneAudio.onended = () => this.activeAudios.delete(cloneKey);
      await cloneAudio.play();
    } catch (e) {
      console.warn('Dual output clone failed', e);
    }
  }

  private cleanupSound(soundId: string, key: string, isTest: boolean) {
    this.activeAudios.delete(key);
    if (isTest) {
      this.activeTestSoundIds.delete(soundId);
    } else {
      this.playingSoundIds.delete(soundId);
    }
    this.notifyListeners();
  }

  private stopInstance(key: string) {
    const item = this.activeAudios.get(key);
    if (item) {
      item.element.onended = null;
      item.element.onerror = null;
      try {
        item.element.pause();
        item.element.currentTime = 0;
        item.element.removeAttribute('src');
        item.element.load();
      } catch (e) {}
      this.activeAudios.delete(key);
    }
  }

  public stop(soundId: string) {
    this.stopInstance(soundId);
    this.stopInstance(`test_${soundId}`);
    this.stopInstance(`dual_${soundId}`);
    this.playingSoundIds.delete(soundId);
    this.activeTestSoundIds.delete(soundId);
    this.notifyListeners();
  }

  public stopAllNonTest() {
    for (const [key, item] of this.activeAudios.entries()) {
      if (!item.isTest) {
        this.stopInstance(key);
      }
    }
    this.playingSoundIds.clear();
    this.notifyListeners();
  }

  public stopAllTest() {
    for (const [key, item] of this.activeAudios.entries()) {
      if (item.isTest) {
        this.stopInstance(key);
      }
    }
    this.activeTestSoundIds.clear();
    this.notifyListeners();
  }

  public stopAll() {
    for (const item of this.activeAudios.values()) {
      item.element.onended = null;
      item.element.onerror = null;
      try {
        item.element.pause();
        item.element.currentTime = 0;
        item.element.removeAttribute('src');
        item.element.load();
      } catch (e) {}
    }
    this.activeAudios.clear();
    this.playingSoundIds.clear();
    this.activeTestSoundIds.clear();
    this.notifyListeners();
  }

  /**
   * Plays a hardware test tone specifically routed to the target deviceId
   */
  public async playTestTone(deviceId: string, isSecondary: boolean = false): Promise<void> {
    try {
      const wavUri = generateChimeWav(isSecondary);
      const audio = new Audio(wavUri);
      audio.volume = isSecondary ? this.config.previewVolume : this.config.masterVolume;

      if (deviceId && deviceId !== 'default' && typeof (audio as any).setSinkId === 'function') {
        try {
          await (audio as any).setSinkId(deviceId);
          console.log(`[AudioEngine] Test tone routed to sink: ${deviceId}`);
        } catch (e: any) {
          console.warn(`[AudioEngine] Failed to setSinkId on test tone for ${deviceId}:`, e.message);
        }
      }

      await audio.play();
    } catch (err: any) {
      console.error('[AudioEngine] playTestTone error:', err.message);
    }
  }
}

export const AudioEngine = new AudioEngineService();
