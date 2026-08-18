export interface SoundItem {
  id: string;
  title: string;
  url: string;
  source: 'myinstants' | 'soundbuttonsworld' | 'local' | 'custom';
  sourceUrl?: string;
  tags: string[];
  color?: string;
  hotkey?: string;
  tab?: string;            // Soundboard page / tab (default "Geral")
  volume?: number;
  playbackRate?: number;
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

export interface TagInfo {
  name: string;
  count: number;
}

export interface AudioOutputDevice {
  deviceId: string;
  label: string;
  groupId: string;
}

export interface AudioRoutingConfig {
  primaryDeviceId: string;
  primaryDeviceLabel: string;
  secondaryDeviceId: string;
  secondaryDeviceLabel: string;
  masterVolume: number;        // 0 to 1
  previewVolume: number;       // 0 to 1
  dualOutputEnabled: boolean;  // play on both outputs simultaneously
  overlapMode: 'overlap' | 'cut' | 'queue';
}
