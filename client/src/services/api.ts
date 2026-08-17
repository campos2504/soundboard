import type { SoundItem, TagInfo, ExternalSoundResult } from '../types';

export const API_BASE = '/api';

export async function fetchSounds(params?: {
  search?: string;
  tag?: string;
  source?: string;
  favorite?: boolean;
}): Promise<SoundItem[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.tag) query.set('tag', params.tag);
  if (params?.source) query.set('source', params.source);
  if (params?.favorite) query.set('favorite', 'true');

  const res = await fetch(`${API_BASE}/sounds?${query.toString()}`);
  if (!res.ok) throw new Error('Falha ao buscar sons da biblioteca');
  return res.json();
}

export async function fetchTags(): Promise<TagInfo[]> {
  const res = await fetch(`${API_BASE}/tags`);
  if (!res.ok) throw new Error('Falha ao buscar tags');
  return res.json();
}

export async function createSound(sound: Partial<SoundItem>): Promise<SoundItem> {
  const res = await fetch(`${API_BASE}/sounds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sound),
  });
  if (!res.ok) throw new Error('Falha ao criar som');
  return res.json();
}

export async function updateSound(id: string, updates: Partial<SoundItem>): Promise<SoundItem> {
  const res = await fetch(`${API_BASE}/sounds/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Falha ao atualizar som');
  return res.json();
}

export async function deleteSound(id: string): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_BASE}/sounds/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Falha ao excluir som');
  return res.json();
}

export async function reorderSounds(soundIds: string[]): Promise<SoundItem[]> {
  const res = await fetch(`${API_BASE}/sounds/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ soundIds }),
  });
  if (!res.ok) throw new Error('Falha ao reordenar sons');
  return res.json();
}

export async function uploadAudioFile(file: File): Promise<{ url: string; filename: string; originalName: string }> {
  const formData = new FormData();
  formData.append('audio', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Falha no upload do arquivo de áudio');
  return res.json();
}

// MyInstants API
export async function searchMyInstants(query: string, page: number = 1): Promise<ExternalSoundResult[]> {
  const res = await fetch(`${API_BASE}/myinstants/search?q=${encodeURIComponent(query)}&page=${page}`);
  if (!res.ok) throw new Error('Erro na busca do MyInstants');
  const data = await res.json();
  return data.results || [];
}

export async function getTrendingMyInstants(region: 'brazil' | 'us' | 'global' = 'brazil'): Promise<ExternalSoundResult[]> {
  const res = await fetch(`${API_BASE}/myinstants/trending?region=${region}`);
  if (!res.ok) throw new Error('Erro ao buscar trending do MyInstants');
  const data = await res.json();
  return data.results || [];
}

// SoundButtonsWorld API
export async function searchSoundButtonsWorld(query: string, page: number = 1): Promise<ExternalSoundResult[]> {
  const res = await fetch(`${API_BASE}/soundbuttonsworld/search?q=${encodeURIComponent(query)}&page=${page}`);
  if (!res.ok) throw new Error('Erro na busca do SoundButtonsWorld');
  const data = await res.json();
  return data.results || [];
}

export async function getTrendingSoundButtonsWorld(page: number = 1, pageSize: number = 30): Promise<ExternalSoundResult[]> {
  const res = await fetch(`${API_BASE}/soundbuttonsworld/trending?page=${page}&pageSize=${pageSize}`);
  if (!res.ok) throw new Error('Erro ao buscar trending do SoundButtonsWorld');
  const data = await res.json();
  return data.results || [];
}

export async function getCategoriesSoundButtonsWorld(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/soundbuttonsworld/categories`);
  if (!res.ok) throw new Error('Erro ao carregar categorias');
  return res.json();
}

export async function resolveSoundUrl(url: string): Promise<{
  title: string;
  url: string;
  source: 'myinstants' | 'soundbuttonsworld' | 'custom';
  sourceUrl?: string;
  tags: string[];
  color?: string;
}> {
  const res = await fetch(`${API_BASE}/resolve-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Falha ao resolver URL' }));
    throw new Error(data.error || 'Falha ao resolver URL');
  }
  return res.json();
}

export function getAudioProxyUrl(url: string): string {
  if (url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return `${API_BASE}/audio-proxy?url=${encodeURIComponent(url)}`;
}
