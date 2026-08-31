import type { SoundItem, TagInfo } from '../types';
import defaultSounds from '../data/defaultSounds.json';

const STORAGE_KEY = 'arcade_soundboard_sounds_v2';
const LEGACY_STORAGE_KEY = 'arcade_soundboard_sounds_v1';
const DB_VERSION_KEY = 'arcade_soundboard_db_version';
const CURRENT_DB_VERSION = '2026-08-31-v3';

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

/**
 * Merges latest default sounds with any custom user-added sounds
 */
function mergeWithDefaults(existingSounds: SoundItem[]): SoundItem[] {
  const defaults = defaultSounds as unknown as SoundItem[];
  const existingMap = new Map(existingSounds.map(s => [s.id, s]));
  const defaultUrls = new Set(defaults.map(s => s.url));

  // Find user-created custom sounds (not in defaults)
  const customUserSounds = existingSounds.filter(s =>
    s.source === 'custom' ||
    s.source === 'local' ||
    (!defaultUrls.has(s.url) && !defaults.some(d => d.id === s.id))
  );

  // Preserve user custom modifications (favorites, hotkeys, volume) on default sounds
  const mergedDefaults = defaults.map(defSound => {
    const existing = existingMap.get(defSound.id);
    if (existing) {
      return {
        ...defSound,
        hotkey: existing.hotkey || defSound.hotkey,
        isFavorite: existing.isFavorite ?? defSound.isFavorite,
        volume: existing.volume ?? defSound.volume,
        playbackRate: existing.playbackRate ?? defSound.playbackRate,
        tab: existing.tab || defSound.tab,
      };
    }
    return defSound;
  });

  return [...customUserSounds, ...mergedDefaults];
}

export class StorageService {
  private static isExtension(): boolean {
    return typeof chrome !== 'undefined' && !!chrome?.storage?.local;
  }

  static async getSounds(): Promise<SoundItem[]> {
    const initialDefaults = defaultSounds as unknown as SoundItem[];

    // 1. Chrome Extension Storage
    if (this.isExtension()) {
      try {
        const stored = await chrome.storage.local.get([STORAGE_KEY, DB_VERSION_KEY, LEGACY_STORAGE_KEY]);
        const version = stored[DB_VERSION_KEY];
        const existing = stored[STORAGE_KEY] || stored[LEGACY_STORAGE_KEY];

        if (version === CURRENT_DB_VERSION && Array.isArray(existing) && existing.length > 0) {
          return existing;
        }

        // Version updated or first run: merge latest defaults
        const merged = Array.isArray(existing) && existing.length > 0 ? mergeWithDefaults(existing) : initialDefaults;
        await chrome.storage.local.set({
          [STORAGE_KEY]: merged,
          [DB_VERSION_KEY]: CURRENT_DB_VERSION,
        });
        return merged;
      } catch (err) {
        console.warn('Chrome storage error, falling back to localStorage:', err);
      }
    }

    // 2. Browser LocalStorage (GitHub Pages / Web)
    try {
      const version = localStorage.getItem(DB_VERSION_KEY);
      const rawStored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      const existing = rawStored ? JSON.parse(rawStored) : null;

      if (version === CURRENT_DB_VERSION && Array.isArray(existing) && existing.length > 0) {
        return existing;
      }

      // Version bump or initial load: apply latest database
      const merged = Array.isArray(existing) && existing.length > 0 ? mergeWithDefaults(existing) : initialDefaults;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
      } catch {}
      return merged;
    } catch (e) {
      console.warn('localStorage read error:', e);
    }

    return initialDefaults;
  }

  static async saveSounds(sounds: SoundItem[]): Promise<void> {
    if (this.isExtension()) {
      try {
        await chrome.storage.local.set({
          [STORAGE_KEY]: sounds,
          [DB_VERSION_KEY]: CURRENT_DB_VERSION
        });
      } catch (e) {
        console.error('Error saving to chrome.storage.local:', e);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sounds));
      localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
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
