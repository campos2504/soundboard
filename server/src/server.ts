import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { SoundsController } from './controllers/sounds.controller.js';
import { audioProxyHandler } from './controllers/audio.proxy.js';
import { MyInstantsService } from './services/myinstants.service.js';
import { SoundButtonsWorldService } from './services/soundbuttonsworld.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer config for audio uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp3';
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${safeName}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// === SOUNDBOARD CRUD ===
app.get('/api/sounds', SoundsController.getAll);
app.get('/api/tags', SoundsController.getTags);
app.post('/api/sounds', SoundsController.create);
app.put('/api/sounds/:id', SoundsController.update);
app.delete('/api/sounds/:id', SoundsController.delete);

// === FILE UPLOAD ===
app.post('/api/upload', upload.single('audio'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No audio file uploaded' });
    return;
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname
  });
});

// === MYINSTANTS API ===
app.get('/api/myinstants/search', async (req, res) => {
  const query = (req.query.q as string) || '';
  const page = parseInt(req.query.page as string, 10) || 1;
  const results = await MyInstantsService.search(query, page);
  res.json({ query, results, count: results.length });
});

app.get('/api/myinstants/trending', async (req, res) => {
  const region = (req.query.region as 'brazil' | 'us' | 'global') || 'brazil';
  const results = await MyInstantsService.getTrending(region);
  res.json({ region, results, count: results.length });
});

// === SOUNDBUTTONSWORLD API ===
app.get('/api/soundbuttonsworld/search', async (req, res) => {
  const query = (req.query.q as string) || '';
  const page = parseInt(req.query.page as string, 10) || 1;
  const results = await SoundButtonsWorldService.search(query, page);
  res.json({ query, results, count: results.length });
});

app.get('/api/soundbuttonsworld/trending', async (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const pageSize = parseInt(req.query.pageSize as string, 10) || 30;
  const results = await SoundButtonsWorldService.getTrending(page, pageSize);
  res.json({ results, count: results.length });
});

app.get('/api/soundbuttonsworld/categories', async (_req, res) => {
  const categories = await SoundButtonsWorldService.getCategories();
  res.json(categories);
});

// === AUDIO PROXY ===
app.get('/api/audio-proxy', audioProxyHandler);

// === SMART URL RESOLVER ===
app.post('/api/resolve-url', async (req, res) => {
  const inputUrl = (req.body.url as string) || '';
  if (!inputUrl.trim()) {
    res.status(400).json({ error: 'URL é obrigatória' });
    return;
  }

  const url = inputUrl.trim();
  try {
    // 1. MyInstants URL resolver
    if (url.includes('myinstants.com')) {
      if (url.endsWith('.mp3')) {
        const name = url.split('/').pop()?.replace('.mp3', '').replace(/[-_]/g, ' ') || 'MyInstants Sound';
        res.json({
          title: name,
          url,
          source: 'myinstants',
          sourceUrl: url,
          tags: ['myinstants', 'meme'],
          color: '#0099ff'
        });
        return;
      }

      const pageRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
      });
      const html = await pageRes.text();
      const playMatch = html.match(/play\('([^']+)'/i) || html.match(/class="small-button" onclick="play\('([^']+)'/i);
      const titleMatch = html.match(/<h1[^>]*id="instant-page-title"[^>]*>([^<]+)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i);
      const colorMatch = html.match(/background-color:\s*([^;"]+)/i);

      if (playMatch) {
        let mp3Url = playMatch[1];
        if (!mp3Url.startsWith('http')) {
          mp3Url = 'https://www.myinstants.com' + mp3Url;
        }
        let title = 'MyInstants Sound';
        if (titleMatch) {
          title = titleMatch[1].replace(/- Instant Sound Buttons/gi, '').replace(/Myinstants/gi, '').trim();
        }

        res.json({
          title,
          url: mp3Url,
          source: 'myinstants',
          sourceUrl: url,
          tags: ['myinstants', 'meme'],
          color: colorMatch ? colorMatch[1].trim() : '#0099ff'
        });
        return;
      }
    }

    // 2. SoundButtonsWorld URL resolver
    if (url.includes('soundbuttonsworld.com')) {
      if (url.includes('/uploads/')) {
        const name = url.split('/').pop()?.replace('.mp3', '') || 'SoundButtonsWorld Sound';
        res.json({
          title: name,
          url,
          source: 'soundbuttonsworld',
          sourceUrl: url,
          tags: ['soundbuttonsworld', 'meme'],
          color: '#00e5ff'
        });
        return;
      }

      const cleanSlug = url.split('/').pop()?.split('?')[0].replace(/-\d+$/, '').replace(/[-_]/g, ' ') || 'meme';
      const searchRes = await SoundButtonsWorldService.search(cleanSlug);
      if (searchRes && searchRes.length > 0) {
        const match = searchRes[0];
        res.json({
          title: match.name,
          url: match.url,
          source: 'soundbuttonsworld',
          sourceUrl: url,
          tags: match.suggestedTags || ['soundbuttonsworld', 'meme'],
          color: match.color || '#00e5ff'
        });
        return;
      }
    }

    // 3. Direct Audio URL fallback
    const fallbackTitle = url.split('/').pop()?.split('?')[0].replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Som Importado';
    res.json({
      title: fallbackTitle,
      url,
      source: 'custom',
      sourceUrl: url,
      tags: ['web', 'importado'],
      color: '#00e5ff'
    });
  } catch (error: any) {
    console.error('Error resolving URL:', error.message);
    res.status(500).json({ error: 'Não foi possível extrair o áudio do link fornecido.' });
  }
});

// Serve frontend in production if client/dist exists
const CLIENT_DIST = path.join(__dirname, '../../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🎮 Steam Deck Soundboard Server running on http://localhost:${PORT}`);
});
