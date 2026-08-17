import { ExternalSoundResult } from '../types.js';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
  if (cleanName.includes('faustao') || cleanName.includes('ratinho') || cleanName.includes('rodrigo faro') || cleanName.includes('ele gosta') || cleanName.includes('ui') || cleanName.includes('demais') || cleanName.includes('cavalo') || cleanName.includes('tome')) {
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

function parseMyInstantsHtml(html: string): ExternalSoundResult[] {
  const results: ExternalSoundResult[] = [];
  
  // Matches <button class="small-button" onclick="play('/media/sounds/...', ...)" ...>
  // and <a href="/en/instant/slug/" class="instant-link ...">Title</a>
  // and color style
  const instantBlockRegex = /<div class="instant[^"]*">([\s\S]*?)<\/div>\s*<\/div>/gi;
  
  // Fallback direct regex
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

    // Extract color if present in the preceding slice
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

export class MyInstantsService {
  static async search(query: string, page: number = 1): Promise<ExternalSoundResult[]> {
    try {
      const url = `https://www.myinstants.com/en/search/?name=${encodeURIComponent(query)}&page=${page}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
      });

      if (!response.ok) {
        console.warn(`MyInstants search returned status ${response.status}`);
        return [];
      }

      const html = await response.text();
      return parseMyInstantsHtml(html);
    } catch (error) {
      console.error('Error fetching MyInstants search:', error);
      return [];
    }
  }

  static async getTrending(region: 'brazil' | 'us' | 'global' = 'brazil'): Promise<ExternalSoundResult[]> {
    try {
      let url = 'https://www.myinstants.com/en/trending/brazil/';
      if (region === 'brazil') {
        url = 'https://www.myinstants.com/pt/index/br/';
      } else if (region === 'us') {
        url = 'https://www.myinstants.com/en/index/us/';
      }

      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
      });

      if (!response.ok) {
        // Fallback to English trending
        const fbResponse = await fetch('https://www.myinstants.com/en/trending/brazil/', {
          headers: { 'User-Agent': USER_AGENT }
        });
        if (!fbResponse.ok) return [];
        const html = await fbResponse.text();
        return parseMyInstantsHtml(html);
      }

      const html = await response.text();
      return parseMyInstantsHtml(html);
    } catch (error) {
      console.error('Error fetching MyInstants trending:', error);
      return [];
    }
  }
}
