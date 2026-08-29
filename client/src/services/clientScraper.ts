import type { ExternalSoundResult } from '../types';

function extractTagsFromName(name: string, category?: string): string[] {
  const tags = new Set<string>();
  if (category) {
    tags.add(category.toLowerCase().replace(/soundboard|sounds|sound/gi, '').trim());
  }

  const cleanName = name.toLowerCase();
  if (cleanName.includes('meme') || cleanName.includes('bruh') || cleanName.includes('vine') || cleanName.includes('goofy')) {
    tags.add('meme');
  }
  if (cleanName.includes('anime') || cleanName.includes('yamete') || cleanName.includes('nani') || cleanName.includes('jojo') || cleanName.includes('uwu')) {
    tags.add('anime');
  }
  if (cleanName.includes('game') || cleanName.includes('roblox') || cleanName.includes('minecraft') || cleanName.includes('mario') || cleanName.includes('gta') || cleanName.includes('fortnite') || cleanName.includes('valorant') || cleanName.includes('csgo') || cleanName.includes('fnaf')) {
    tags.add('gaming');
  }
  if (cleanName.includes('scream') || cleanName.includes('grito') || cleanName.includes('loud') || cleanName.includes('earrape')) {
    tags.add('grito');
    tags.add('loud');
  }
  if (cleanName.includes('laugh') || cleanName.includes('risada') || cleanName.includes('haha') || cleanName.includes('chuckle') || cleanName.includes('kiko')) {
    tags.add('risada');
  }
  if (cleanName.includes('music') || cleanName.includes('song') || cleanName.includes('funk') || cleanName.includes('phonk') || cleanName.includes('bass')) {
    tags.add('musica');
  }
  if (cleanName.includes('faustao') || cleanName.includes('ratinho') || cleanName.includes('rodrigo faro') || cleanName.includes('ele gosta') || cleanName.includes('ui') || cleanName.includes('demais') || cleanName.includes('cavalo') || cleanName.includes('tome') || cleanName.includes('dança gatinho')) {
    tags.add('brasil');
    tags.add('tv');
    tags.add('meme');
  }
  if (cleanName.includes('discord') || cleanName.includes('notification') || cleanName.includes('error') || cleanName.includes('windows')) {
    tags.add('sfx');
  }

  if (tags.size === 0) {
    tags.add('geral');
  }

  return Array.from(tags).filter(t => t.length > 0);
}

export function parseMyInstantsHtml(html: string): ExternalSoundResult[] {
  const results: ExternalSoundResult[] = [];
  const buttonRegex = /onclick="play\('([^']+)'[^"]*"[^>]*>[\s\S]*?<a href="([^"]+)" class="instant-link[^"]*">([^<]+)<\/a>/gi;
  
  let match;
  while ((match = buttonRegex.exec(html)) !== null) {
    let soundUrl = match[1];
    if (!soundUrl.startsWith('http')) {
      soundUrl = 'https://www.myinstants.com' + soundUrl;
    }
    const pageUrl = 'https://www.myinstants.com' + match[2];
    const name = match[3].trim();
    const id = 'myinstants_' + match[2].replace(/[^a-zA-Z0-9_-]/g, '_');

    const sliceBefore = html.slice(Math.max(0, match.index - 150), match.index);
    const colorMatch = sliceBefore.match(/background-color:\s*([^;"]+)/i);
    const color = colorMatch ? colorMatch[1].trim() : undefined;

    results.push({
      id,
      name,
      url: soundUrl,
      source: 'myinstants',
      pageUrl,
      color,
      suggestedTags: extractTagsFromName(name)
    });
  }

  return results;
}

export class DirectScraperService {
  static async searchMyInstants(query: string, page: number = 1): Promise<ExternalSoundResult[]> {
    const url = `https://www.myinstants.com/en/search/?name=${encodeURIComponent(query)}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const html = await res.text();
    return parseMyInstantsHtml(html);
  }

  static async getTrendingMyInstants(region: 'brazil' | 'us' | 'global' = 'brazil'): Promise<ExternalSoundResult[]> {
    let url = 'https://www.myinstants.com/pt/index/br/';
    if (region === 'us') url = 'https://www.myinstants.com/en/index/us/';
    if (region === 'global') url = 'https://www.myinstants.com/en/trending/brazil/';

    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      const html = await res.text();
      return parseMyInstantsHtml(html);
    } catch {
      return [];
    }
  }

  static async searchSoundButtonsWorld(query: string): Promise<ExternalSoundResult[]> {
    try {
      const url = `https://soundbuttonsworld.com/api/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      const results: ExternalSoundResult[] = [];
      if (json && Array.isArray(json.results)) {
        for (const item of json.results) {
          const fileName = item.fileName || item.filePath;
          if (!fileName) continue;
          const soundUrl = `https://soundbuttonsworld.com/uploads/${fileName}`;
          const name = item.title || item.name || 'Sound Button';
          results.push({
            id: 'sbw_' + (item.id || item.url || fileName.replace('.mp3', '')),
            name: name.trim(),
            url: soundUrl,
            source: 'soundbuttonsworld',
            pageUrl: item.url ? `https://soundbuttonsworld.com/${item.url}` : undefined,
            category: item.category,
            color: item.color,
            suggestedTags: extractTagsFromName(name, item.category)
          });
        }
      }
      return results;
    } catch {
      return [];
    }
  }

  static async getTrendingSoundButtonsWorld(page: number = 1, pageSize: number = 30): Promise<ExternalSoundResult[]> {
    try {
      const url = `https://soundbuttonsworld.com/api/memes/getall?page=${page}&pageSize=${pageSize}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      const results: ExternalSoundResult[] = [];
      const list = json.data || (Array.isArray(json) ? json : []);
      for (const item of list) {
        if (!item.fileName) continue;
        const soundUrl = `https://soundbuttonsworld.com/uploads/${item.fileName}`;
        const name = item.name || 'Sound';
        results.push({
          id: 'sbw_' + (item.id || item.url || item.fileName.replace('.mp3', '')),
          name: name.trim(),
          url: soundUrl,
          source: 'soundbuttonsworld',
          pageUrl: item.url ? `https://soundbuttonsworld.com/${item.url}` : undefined,
          category: item.categoryName || item.category,
          color: item.color,
          suggestedTags: extractTagsFromName(name, item.categoryName || item.category)
        });
      }
      return results;
    } catch {
      return [];
    }
  }
}
