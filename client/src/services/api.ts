import type { SoundItem, TagInfo, ExternalSoundResult } from '../types';
import { StorageService, storeAudioBlob } from './StorageService';
import { DirectScraperService } from './clientScraper';

export const API_BASE = '/api';

// Helper to test if backend is active
let backendChecked = false;
let backendAvailable = false;

async function isBackendAvailable(): Promise<boolean> {
  if (backendChecked) return backendAvailable;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 800);
    const res = await fetch(`${API_BASE}/tags`, { signal: controller.signal });
    clearTimeout(id);
    backendAvailable = res.ok;
  } catch {
    backendAvailable = false;
  }
  backendChecked = true;
  return backendAvailable;
}

export async function fetchSounds(params?: {
  search?: string;
  tag?: string;
  source?: string;
  favorite?: boolean;
}): Promise<SoundItem[]> {
  try {
    if (await isBackendAvailable()) {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.tag) query.set('tag', params.tag);
      if (params?.source) query.set('source', params.source);
      if (params?.favorite) query.set('favorite', 'true');

      const res = await fetch(`${API_BASE}/sounds?${query.toString()}`);
      if (res.ok) return res.json();
    }
  } catch (err) {
    console.warn('Backend fetch failed, using local StorageService:', err);
  }

  // Fallback to local storage
  let sounds = await StorageService.getSounds();

  if (params?.search) {
    const q = params.search.toLowerCase();
    sounds = sounds.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (params?.tag) {
    const targetTags = params.tag.split(',').map(t => t.trim().toLowerCase());
    sounds = sounds.filter(s =>
      targetTags.every(tt => s.tags.map(t => t.toLowerCase()).includes(tt))
    );
  }

  if (params?.source) {
    sounds = sounds.filter(s => s.source === params.source);
  }

  if (params?.favorite) {
    sounds = sounds.filter(s => s.isFavorite === true);
  }

  return sounds;
}

export async function fetchTags(): Promise<TagInfo[]> {
  try {
    if (await isBackendAvailable()) {
      const res = await fetch(`${API_BASE}/tags`);
      if (res.ok) return res.json();
    }
  } catch (err) {
    console.warn('Backend fetch tags failed, using local StorageService:', err);
  }
  return StorageService.getTags();
}

export async function createSound(sound: Partial<SoundItem>): Promise<SoundItem> {
  try {
    if (await isBackendAvailable()) {
      const res = await fetch(`${API_BASE}/sounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sound),
      });
      if (res.ok) {
        const created = await res.json();
        await StorageService.createSound(created);
        return created;
      }
    }
  } catch (err) {
    console.warn('Backend createSound failed, using local StorageService:', err);
  }
  return StorageService.createSound(sound);
}

export async function updateSound(id: string, updates: Partial<SoundItem>): Promise<SoundItem> {
  try {
    if (await isBackendAvailable()) {
      const res = await fetch(`${API_BASE}/sounds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        await StorageService.updateSound(id, updates);
        return updated;
      }
    }
  } catch (err) {
    console.warn('Backend updateSound failed, using local StorageService:', err);
  }
  return StorageService.updateSound(id, updates);
}

export async function deleteSound(id: string): Promise<{ success: boolean; id: string }> {
  try {
    if (await isBackendAvailable()) {
      const res = await fetch(`${API_BASE}/sounds/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await StorageService.deleteSound(id);
        return res.json();
      }
    }
  } catch (err) {
    console.warn('Backend deleteSound failed, using local StorageService:', err);
  }
  return StorageService.deleteSound(id);
}

export async function reorderSounds(soundIds: string[]): Promise<SoundItem[]> {
  try {
    if (await isBackendAvailable()) {
      const res = await fetch(`${API_BASE}/sounds/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soundIds }),
      });
      if (res.ok) {
        const reordered = await res.json();
        await StorageService.reorderSounds(soundIds);
        return reordered;
      }
    }
  } catch (err) {
    console.warn('Backend reorderSounds failed, using local StorageService:', err);
  }
  return StorageService.reorderSounds(soundIds);
}

export async function uploadAudioFile(file: File): Promise<{ url: string; filename: string; originalName: string }> {
  try {
    if (await isBackendAvailable()) {
      const formData = new FormData();
      formData.append('audio', file);
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) return res.json();
    }
  } catch (err) {
    console.warn('Backend upload failed, storing in IndexedDB/blob:', err);
  }

  // Store locally in IndexedDB / ObjectURL
  const blobId = `upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  await storeAudioBlob(blobId, file);
  const blobUrl = URL.createObjectURL(file);

  return {
    url: blobUrl,
    filename: file.name,
    originalName: file.name,
  };
}

// MyInstants API (Direct scraping in Extension / Fallback to backend)
export async function searchMyInstants(query: string, page: number = 1): Promise<ExternalSoundResult[]> {
  // Direct scraping
  try {
    const directResults = await DirectScraperService.searchMyInstants(query, page);
    if (directResults.length > 0) return directResults;
  } catch (e) {
    console.warn('Direct scraper failed, trying backend:', e);
  }

  try {
    if (await isBackendAvailable()) {
      const res = await fetch(`${API_BASE}/myinstants/search?q=${encodeURIComponent(query)}&page=${page}`);
      if (res.ok) {
        const data = await res.json();
        return data.results || [];
      }
    }
  } catch {}

  return [];
}

export async function getTrendingMyInstants(region: 'brazil' | 'us' | 'global' = 'brazil'): Promise<ExternalSoundResult[]> {
  try {
    const directResults = await DirectScraperService.getTrendingMyInstants(region);
    if (directResults.length > 0) return directResults;
  } catch (e) {
    console.warn('Direct trending scraper failed, trying backend:', e);
  }

  try {
    if (await isBackendAvailable()) {
      const res = await fetch(`${API_BASE}/myinstants/trending?region=${region}`);
      if (res.ok) {
        const data = await res.json();
        return data.results || [];
      }
    }
  } catch {}

  return [];
}

// SoundButtonsWorld API
export async function searchSoundButtonsWorld(query: string, page: number = 1): Promise<ExternalSoundResult[]> {
  try {
    const directResults = await DirectScraperService.searchSoundButtonsWorld(query);
    if (directResults.length > 0) return directResults;
  } catch (e) {
    console.warn('Direct SBW scraper failed, trying backend:', e);
  }

  try {
    if (await isBackendAvailable()) {
      const res = await fetch(`${API_BASE}/soundbuttonsworld/search?q=${encodeURIComponent(query)}&page=${page}`);
      if (res.ok) {
        const data = await res.json();
        return data.results || [];
      }
    }
  } catch {}

  return [];
}

export async function getTrendingSoundButtonsWorld(page: number = 1, pageSize: number = 30): Promise<ExternalSoundResult[]> {
  try {
    const directResults = await DirectScraperService.getTrendingSoundButtonsWorld(page, pageSize);
    if (directResults.length > 0) return directResults;
  } catch (e) {
    console.warn('Direct SBW trending failed, trying backend:', e);
  }

  try {
    if (await isBackendAvailable()) {
      const res = await fetch(`${API_BASE}/soundbuttonsworld/trending?page=${page}&pageSize=${pageSize}`);
      if (res.ok) {
        const data = await res.json();
        return data.results || [];
      }
    }
  } catch {}

  return [];
}

export async function getCategoriesSoundButtonsWorld(): Promise<any[]> {
  try {
    if (await isBackendAvailable()) {
      const res = await fetch(`${API_BASE}/soundbuttonsworld/categories`);
      if (res.ok) return res.json();
    }
  } catch {}
  return [
    { id: 1, name: 'Memes', slug: 'memes' },
    { id: 2, name: 'Gaming', slug: 'gaming' },
    { id: 3, name: 'Anime', slug: 'anime' },
    { id: 4, name: 'Sound Effects', slug: 'sound-effects' }
  ];
}

export async function resolveSoundUrl(inputUrl: string): Promise<{
  title: string;
  url: string;
  source: 'myinstants' | 'soundbuttonsworld' | 'custom';
  sourceUrl?: string;
  tags: string[];
  color?: string;
}> {
  const input = inputUrl.trim();
  if (!input) throw new Error('Nenhum link fornecido');

  // Client-side parser for MyInstants onclick snippets
  const playMatch = input.match(/play\(['"]([^'"]+)['"]/i);
  if (playMatch) {
    let audioPath = playMatch[1];
    if (!audioPath.startsWith('http')) {
      audioPath = 'https://www.myinstants.com' + (audioPath.startsWith('/') ? '' : '/') + audioPath;
    }
    const title = audioPath.split('/').pop()?.replace('.mp3', '').replace(/[-_]/g, ' ') || 'MyInstants Sound';
    return {
      title,
      url: audioPath,
      source: 'myinstants',
      sourceUrl: audioPath,
      tags: ['myinstants', 'meme'],
      color: '#1a9fff'
    };
  }

  if (input.includes('myinstants.com')) {
    if (input.includes('.mp3')) {
      const title = input.split('/').pop()?.replace('.mp3', '').replace(/[-_]/g, ' ') || 'MyInstants Sound';
      return {
        title,
        url: input,
        source: 'myinstants',
        sourceUrl: input,
        tags: ['myinstants', 'meme'],
        color: '#1a9fff'
      };
    }
    // Instant page URL
    try {
      const res = await fetch(input);
      if (res.ok) {
        const html = await res.text();
        const btnMatch = html.match(/onclick="play\('([^']+)'/i);
        if (btnMatch) {
          let soundUrl = btnMatch[1];
          if (!soundUrl.startsWith('http')) soundUrl = 'https://www.myinstants.com' + soundUrl;
          const titleMatch = html.match(/<h1[^>]*id="instant-page-title"[^>]*>([^<]+)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].replace('- Myinstants', '').trim() : 'MyInstants Sound';
          return {
            title,
            url: soundUrl,
            source: 'myinstants',
            sourceUrl: input,
            tags: ['myinstants', 'meme'],
            color: '#1a9fff'
          };
        }
      }
    } catch {}
  }

  if (input.includes('soundbuttonsworld.com')) {
    if (input.includes('/uploads/') && input.endsWith('.mp3')) {
      const title = input.split('/').pop()?.replace('.mp3', '').replace(/[-_]/g, ' ') || 'SoundButtonsWorld Sound';
      return {
        title,
        url: input,
        source: 'soundbuttonsworld',
        sourceUrl: input,
        tags: ['soundbuttonsworld', 'meme'],
        color: '#00e5ff'
      };
    }
  }

  // Direct MP3/WAV/OGG link
  if (input.match(/\.(mp3|wav|ogg|aac|m4a)(\?.*)?$/i)) {
    const rawName = input.split('/').pop()?.split('?')[0]?.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' ') || 'Áudio da Web';
    return {
      title: decodeURIComponent(rawName),
      url: input,
      source: 'custom',
      sourceUrl: input,
      tags: ['web', 'custom'],
      color: '#ff007f'
    };
  }

  // Try backend resolver if online
  try {
    if (await isBackendAvailable()) {
      const res = await fetch(`${API_BASE}/resolve-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input }),
      });
      if (res.ok) return res.json();
    }
  } catch {}

  throw new Error('Não foi possível identificar o som nesta URL. Tente colar o link direto do .mp3 ou do MyInstants.');
}

export function getAudioProxyUrl(url: string): string {
  // In extension or direct audio, we can play directly without proxy
  if (url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http')) {
    return url;
  }
  return url;
}
