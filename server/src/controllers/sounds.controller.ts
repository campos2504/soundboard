import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { SoundItem } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../data/sounds.json');

async function loadSounds(): Promise<SoundItem[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading sounds.json, returning empty:', err);
    return [];
  }
}

async function saveSounds(sounds: SoundItem[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(sounds, null, 2), 'utf-8');
}

export class SoundsController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const sounds = await loadSounds();
      const { search, tag, source, favorite } = req.query;

      let filtered = sounds;

      if (search && typeof search === 'string') {
        const query = search.toLowerCase();
        filtered = filtered.filter(s => 
          s.title.toLowerCase().includes(query) || 
          s.tags.some(t => t.toLowerCase().includes(query))
        );
      }

      if (tag && typeof tag === 'string') {
        const targetTags = tag.split(',').map(t => t.trim().toLowerCase());
        filtered = filtered.filter(s => 
          targetTags.every(tt => s.tags.map(t => t.toLowerCase()).includes(tt))
        );
      }

      if (source && typeof source === 'string') {
        filtered = filtered.filter(s => s.source === source);
      }

      if (favorite === 'true') {
        filtered = filtered.filter(s => s.isFavorite === true);
      }

      res.json(filtered);
    } catch (error) {
      console.error('Error in getAll sounds:', error);
      res.status(500).json({ error: 'Failed to retrieve sounds' });
    }
  }

  static async getTags(req: Request, res: Response): Promise<void> {
    try {
      const sounds = await loadSounds();
      const tagCountMap: Record<string, number> = {};

      for (const sound of sounds) {
        for (const rawTag of sound.tags) {
          const t = rawTag.toLowerCase().trim();
          if (t) {
            tagCountMap[t] = (tagCountMap[t] || 0) + 1;
          }
        }
      }

      const tags = Object.entries(tagCountMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      res.json(tags);
    } catch (error) {
      console.error('Error in getTags:', error);
      res.status(500).json({ error: 'Failed to retrieve tags' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, url, source, sourceUrl, tags, color, hotkey, volume, playbackRate, isFavorite } = req.body;

      if (!title || !url) {
        res.status(400).json({ error: 'title and url are required' });
        return;
      }

      const sounds = await loadSounds();
      const newSound: SoundItem = {
        id: 'sound_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: title.trim(),
        url: url.trim(),
        source: source || 'custom',
        sourceUrl,
        tags: Array.isArray(tags) ? tags.map((t: string) => t.trim().toLowerCase()) : [],
        color: color || '#1a9fff',
        hotkey: hotkey ? hotkey.toUpperCase().trim() : undefined,
        volume: typeof volume === 'number' ? Math.max(0, Math.min(2, volume)) : 1,
        playbackRate: typeof playbackRate === 'number' ? Math.max(0.2, Math.min(3, playbackRate)) : 1,
        isFavorite: Boolean(isFavorite),
        createdAt: Date.now()
      };

      sounds.unshift(newSound);
      await saveSounds(sounds);

      res.status(201).json(newSound);
    } catch (error) {
      console.error('Error creating sound:', error);
      res.status(500).json({ error: 'Failed to create sound' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sounds = await loadSounds();
      const index = sounds.findIndex(s => s.id === id);

      if (index === -1) {
        res.status(404).json({ error: 'Sound not found' });
        return;
      }

      const current = sounds[index];
      const updates = req.body;

      const updated: SoundItem = {
        ...current,
        title: updates.title !== undefined ? updates.title.trim() : current.title,
        url: updates.url !== undefined ? updates.url.trim() : current.url,
        tags: updates.tags !== undefined 
          ? (Array.isArray(updates.tags) ? updates.tags.map((t: string) => t.trim().toLowerCase()) : current.tags)
          : current.tags,
        color: updates.color !== undefined ? updates.color : current.color,
        hotkey: updates.hotkey !== undefined ? (updates.hotkey ? updates.hotkey.toUpperCase().trim() : undefined) : current.hotkey,
        volume: updates.volume !== undefined ? Math.max(0, Math.min(2, Number(updates.volume))) : current.volume,
        playbackRate: updates.playbackRate !== undefined ? Math.max(0.2, Math.min(3, Number(updates.playbackRate))) : current.playbackRate,
        isFavorite: updates.isFavorite !== undefined ? Boolean(updates.isFavorite) : current.isFavorite,
      };

      sounds[index] = updated;
      await saveSounds(sounds);

      res.json(updated);
    } catch (error) {
      console.error('Error updating sound:', error);
      res.status(500).json({ error: 'Failed to update sound' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const sounds = await loadSounds();
      const filtered = sounds.filter(s => s.id !== id);

      if (filtered.length === sounds.length) {
        res.status(404).json({ error: 'Sound not found' });
        return;
      }

      await saveSounds(filtered);
      res.json({ success: true, id });
    } catch (error) {
      console.error('Error deleting sound:', error);
      res.status(500).json({ error: 'Failed to delete sound' });
    }
  }

  static async reorder(req: Request, res: Response): Promise<void> {
    try {
      const { soundIds } = req.body;
      if (!Array.isArray(soundIds)) {
        res.status(400).json({ error: 'soundIds array is required' });
        return;
      }

      const sounds = await loadSounds();
      const soundMap = new Map(sounds.map(s => [s.id, s]));
      const reordered: SoundItem[] = [];

      for (const id of soundIds) {
        const item = soundMap.get(id);
        if (item) {
          reordered.push(item);
          soundMap.delete(id);
        }
      }

      // Append any remaining sounds
      for (const item of soundMap.values()) {
        reordered.push(item);
      }

      await saveSounds(reordered);
      res.json(reordered);
    } catch (error) {
      console.error('Error reordering sounds:', error);
      res.status(500).json({ error: 'Failed to reorder sounds' });
    }
  }
}
