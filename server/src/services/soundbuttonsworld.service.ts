import { ExternalSoundResult } from '../types.js';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BASE_UPLOAD_URL = 'https://soundbuttonsworld.com/uploads';

function extractTags(name: string, category?: string, mood?: string): string[] {
  const tags = new Set<string>();
  if (category) {
    tags.add(category.toLowerCase().replace(/soundboard|sounds|sound/gi, '').trim());
  }
  if (mood && mood !== 'n' && mood !== 'default') {
    tags.add(mood.toLowerCase().trim());
  }

  const cleanName = name.toLowerCase();
  if (cleanName.includes('meme') || cleanName.includes('bruh') || cleanName.includes('vine') || cleanName.includes('goofy') || cleanName.includes('fart')) {
    tags.add('meme');
  }
  if (cleanName.includes('anime') || cleanName.includes('jojo') || cleanName.includes('naruto') || cleanName.includes('goku') || cleanName.includes('dragon ball')) {
    tags.add('anime');
  }
  if (cleanName.includes('game') || cleanName.includes('roblox') || cleanName.includes('minecraft') || cleanName.includes('fortnite') || cleanName.includes('mario') || cleanName.includes('zelda') || cleanName.includes('gta')) {
    tags.add('gaming');
  }
  if (cleanName.includes('scream') || cleanName.includes('grito') || cleanName.includes('loud') || cleanName.includes('boom')) {
    tags.add('grito');
    tags.add('loud');
  }
  if (cleanName.includes('laugh') || cleanName.includes('risada') || cleanName.includes('kiko') || cleanName.includes('snicker')) {
    tags.add('risada');
  }
  if (cleanName.includes('sound') || cleanName.includes('effect') || cleanName.includes('sfx') || cleanName.includes('beep')) {
    tags.add('sfx');
  }
  if (tags.size === 0) {
    tags.add('geral');
  }

  return Array.from(tags).filter(t => t.length > 0);
}

export class SoundButtonsWorldService {
  static async search(query: string, page: number = 1): Promise<ExternalSoundResult[]> {
    try {
      const url = `https://soundbuttonsworld.com/api/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
      });

      if (!response.ok) {
        console.warn(`SoundButtonsWorld search status: ${response.status}`);
        return [];
      }

      const json = await response.json();
      const results: ExternalSoundResult[] = [];

      if (json && Array.isArray(json.results)) {
        for (const item of json.results) {
          const fileName = item.fileName || item.filePath;
          if (!fileName) continue;

          const soundUrl = `${BASE_UPLOAD_URL}/${fileName}`;
          const name = item.title || item.name || 'Sound Button';

          results.push({
            id: 'sbw_' + (item.id || item.url || fileName.replace('.mp3', '')),
            name: name.trim(),
            url: soundUrl,
            source: 'soundbuttonsworld',
            pageUrl: item.url ? `https://soundbuttonsworld.com/${item.url}` : undefined,
            category: item.category,
            color: item.color,
            suggestedTags: extractTags(name, item.category, item.mood)
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in SoundButtonsWorld search:', error);
      return [];
    }
  }

  static async getTrending(page: number = 1, pageSize: number = 30): Promise<ExternalSoundResult[]> {
    try {
      const url = `https://soundbuttonsworld.com/api/memes/getall?page=${page}&pageSize=${pageSize}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
      });

      if (!response.ok) {
        console.warn(`SoundButtonsWorld trending status: ${response.status}`);
        return [];
      }

      const json = await response.json();
      const results: ExternalSoundResult[] = [];

      const list = json.data || (Array.isArray(json) ? json : []);
      for (const item of list) {
        if (!item.fileName) continue;
        const soundUrl = `${BASE_UPLOAD_URL}/${item.fileName}`;
        const name = item.name || 'Sound';

        results.push({
          id: 'sbw_' + (item.id || item.url || item.fileName.replace('.mp3', '')),
          name: name.trim(),
          url: soundUrl,
          source: 'soundbuttonsworld',
          pageUrl: item.url ? `https://soundbuttonsworld.com/${item.url}` : undefined,
          category: item.categoryName || item.category,
          color: item.color,
          suggestedTags: extractTags(name, item.categoryName || item.category)
        });
      }

      return results;
    } catch (error) {
      console.error('Error in SoundButtonsWorld getTrending:', error);
      return [];
    }
  }

  static async getCategories(): Promise<any[]> {
    try {
      const url = 'https://soundbuttonsworld.com/api/categories/getall';
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
      });
      if (!response.ok) return [];
      const json = await response.json();
      return Array.isArray(json) ? json : [];
    } catch (error) {
      console.error('Error in SoundButtonsWorld getCategories:', error);
      return [];
    }
  }
}
