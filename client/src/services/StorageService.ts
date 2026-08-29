import type { SoundItem, TagInfo } from '../types';
import defaultSounds from '../data/defaultSounds.json';

const STORAGE_KEY = 'arcade_soundboard_sounds_v1';

// IndexedDB helper for large files and audio blobs
const DB_NAME = 'ArcadeSoundboardDB';
const DB_VERSION = 1;
const AUDIO_STORE = 'audio_blobs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeAudioBlob(id: string, blob: Blob): Promise<string> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, 'readwrite');
      const store = tx.objectStore(AUDIO_STORE);
      const req = store.put(blob, id);
      req.onsuccess = () => resolve(`blob-id:${id}`);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to base64 data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }
}

export async function getAudioBlobUrl(blobIdOrUrl: string): Promise<string> {
  if (!blobIdOrUrl.startsWith('blob-id:')) {
    return blobIdOrUrl;
  }
  const id = blobIdOrUrl.replace('blob-id:', '');
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, 'readonly');
      const store = tx.objectStore(AUDIO_STORE);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result instanceof Blob) {
          resolve(URL.createObjectURL(req.result));
        } else {
          resolve(blobIdOrUrl);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return blobIdOrUrl;
  }
}

export class StorageService {
  private static isExtension(): boolean {
    return typeof chrome !== 'undefined' && !!chrome?.storage?.local;
  }

  static async getSounds(): Promise<SoundItem[]> {
    if (this.isExtension()) {
      try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        if (data && Array.isArray(data[STORAGE_KEY]) && data[STORAGE_KEY].length > 0) {
          return data[STORAGE_KEY];
        }
        // Seed default sounds if empty
        const initial = defaultSounds as unknown as SoundItem[];
        await chrome.storage.local.set({ [STORAGE_KEY]: initial });
        return initial;
      } catch (err) {
        console.warn('Chrome storage error, falling back to localStorage:', err);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('localStorage read error:', e);
    }

    // Seed defaults
    const initial = defaultSounds as unknown as SoundItem[];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch {}
    return initial;
  }

  static async saveSounds(sounds: SoundItem[]): Promise<void> {
    if (this.isExtension()) {
      try {
        await chrome.storage.local.set({ [STORAGE_KEY]: sounds });
      } catch (e) {
        console.error('Error saving to chrome.storage.local:', e);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sounds));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  static async getTags(): Promise<TagInfo[]> {
    const sounds = await this.getSounds();
    const tagMap = new Map<string, number>();

    for (const sound of sounds) {
      if (Array.isArray(sound.tags)) {
        for (const tag of sound.tags) {
          const cleanTag = tag.trim().toLowerCase();
          if (cleanTag) {
            tagMap.set(cleanTag, (tagMap.get(cleanTag) || 0) + 1);
          }
        }
      }
    }

    return Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  static async createSound(soundData: Partial<SoundItem>): Promise<SoundItem> {
    const sounds = await this.getSounds();
    const newSound: SoundItem = {
      id: soundData.id || `sound_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: soundData.title || 'Novo Som',
      url: soundData.url || '',
      source: soundData.source || 'custom',
      sourceUrl: soundData.sourceUrl,
      tags: soundData.tags && soundData.tags.length > 0 ? soundData.tags : ['geral'],
      color: soundData.color || '#1a9fff',
      hotkey: soundData.hotkey,
      tab: soundData.tab || 'Geral',
      volume: soundData.volume ?? 1,
      playbackRate: soundData.playbackRate ?? 1,
      isFavorite: soundData.isFavorite ?? false,
      startTime: soundData.startTime,
      endTime: soundData.endTime,
      duration: soundData.duration,
      createdAt: soundData.createdAt || Date.now(),
    };

    const updated = [newSound, ...sounds];
    await this.saveSounds(updated);
    return newSound;
  }

  static async updateSound(id: string, updates: Partial<SoundItem>): Promise<SoundItem> {
    const sounds = await this.getSounds();
    const index = sounds.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Som não encontrado: ${id}`);
    }

    sounds[index] = { ...sounds[index], ...updates };
    await this.saveSounds(sounds);
    return sounds[index];
  }

  static async deleteSound(id: string): Promise<{ success: boolean; id: string }> {
    const sounds = await this.getSounds();
    const updated = sounds.filter(s => s.id !== id);
    await this.saveSounds(updated);
    return { success: true, id };
  }

  static async reorderSounds(soundIds: string[]): Promise<SoundItem[]> {
    const sounds = await this.getSounds();
    const soundMap = new Map(sounds.map(s => [s.id, s]));
    const reordered: SoundItem[] = [];

    for (const id of soundIds) {
      const sound = soundMap.get(id);
      if (sound) {
        reordered.push(sound);
        soundMap.delete(id);
      }
    }

    // Append any remaining sounds
    for (const sound of soundMap.values()) {
      reordered.push(sound);
    }

    await this.saveSounds(reordered);
    return reordered;
  }

  static async resetToDefaultSounds(): Promise<SoundItem[]> {
    const initial = defaultSounds as unknown as SoundItem[];
    await this.saveSounds(initial);
    return initial;
  }
}
