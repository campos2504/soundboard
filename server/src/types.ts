export interface SoundItem {
  id: string;
  title: string;
  url: string;             // Audio stream URL or local path
  source: 'myinstants' | 'soundbuttonsworld' | 'local' | 'custom';
  sourceUrl?: string;      // Original page link
  tags: string[];          // e.g. ["meme", "gaming", "anime"]
  color?: string;          // Steam Deck accent color hex or class
  hotkey?: string;         // e.g. "1", "Q", "F1", "Numpad1"
  tab?: string;            // Soundboard page / tab (default "Geral")
  volume?: number;         // 0 to 1 (multiplier, default 1)
  playbackRate?: number;   // 0.5 to 2.0 (default 1)
  isFavorite?: boolean;
  duration?: number;
  createdAt: number;
}

export interface ExternalSoundResult {
  id: string;
  name: string;
  url: string;
  source: 'myinstants' | 'soundbuttonsworld';
  pageUrl?: string;
  category?: string;
  color?: string;
  suggestedTags: string[];
}
