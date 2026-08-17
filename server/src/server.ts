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

// === UNIVERSAL BUTTON / URL RESOLVER ===
app.post('/api/resolve-url', async (req, res) => {
  const input = ((req.body.url || req.body.text || '') as string).trim();
  if (!input) {
    res.status(400).json({ error: 'Nenhum link ou botão fornecido' });
    return;
  }

  try {
    // 1. If user copied an onclick/embed snippet: play('/media/sounds/....mp3')
    const playMatch = input.match(/play\(['"]([^'"]+)['"]/i);
    if (playMatch) {
      let audioPath = playMatch[1];
      if (!audioPath.startsWith('http')) {
        audioPath = 'https://www.myinstants.com' + (audioPath.startsWith('/') ? '' : '/') + audioPath;
      }
      const title = audioPath.split('/').pop()?.replace('.mp3', '').replace(/[-_]/g, ' ') || 'MyInstants Sound';
      res.json({
        title,
        url: audioPath,
        source: 'myinstants',
        sourceUrl: audioPath,
        tags: ['myinstants', 'meme'],
        color: '#1a9fff'
      });
      return;
    }

    // 2. Relative paths: /media/sounds/... or /uploads/...
    if (input.startsWith('/media/sounds/')) {
      const fullUrl = 'https://www.myinstants.com' + input;
      const title = input.split('/').pop()?.replace('.mp3', '').replace(/[-_]/g, ' ') || 'MyInstants Sound';
      res.json({
        title,
        url: fullUrl,
        source: 'myinstants',
        sourceUrl: fullUrl,
        tags: ['myinstants', 'meme'],
        color: '#1a9fff'
      });
      return;
    }

    if (input.startsWith('/uploads/')) {
      const fullUrl = 'https://soundbuttonsworld.com' + input;
      const title = input.split('/').pop()?.replace('.mp3', '').replace(/[-_]/g, ' ') || 'SoundButtonsWorld Sound';
      res.json({
        title,
        url: fullUrl,
        source: 'soundbuttonsworld',
        sourceUrl: fullUrl,
        tags: ['soundbuttonsworld', 'meme'],
        color: '#ff7700'
      });
      return;
    }

    // 3. Extract http URL if embedded in text/html
    const urlMatch = input.match(/https?:\/\/[^\s"'<>]+/i);
    if (urlMatch) {
      const url = urlMatch[0];

      // Direct audio file link
      if (url.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i)) {
        const title = url.split('/').pop()?.split('?')[0].replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Som';
        const source = url.includes('myinstants') ? 'myinstants' : url.includes('soundbuttonsworld') ? 'soundbuttonsworld' : 'custom';
        res.json({
          title,
          url,
          source,
          sourceUrl: url,
          tags: [source, 'meme'],
          color: source === 'soundbuttonsworld' ? '#ff7700' : '#1a9fff'
        });
        return;
      }

      // MyInstants Page URL
      if (url.includes('myinstants.com')) {
        const pageRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
        });
        const html = await pageRes.text();
        const pagePlayMatch = html.match(/play\(['"]([^'"]+)['"]/i);
        const titleMatch = html.match(/<h1[^>]*id="instant-page-title"[^>]*>([^<]+)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i);
        const colorMatch = html.match(/background-color:\s*([^;"]+)/i);

        if (pagePlayMatch) {
          let mp3Url = pagePlayMatch[1];
          if (!mp3Url.startsWith('http')) {
            mp3Url = 'https://www.myinstants.com' + (mp3Url.startsWith('/') ? '' : '/') + mp3Url;
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
            color: colorMatch ? colorMatch[1].trim() : '#1a9fff'
          });
          return;
        }
      }

      // SoundButtonsWorld Page URL
      if (url.includes('soundbuttonsworld.com')) {
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
            color: match.color || '#ff7700'
          });
          return;
        }
      }
    }

    // 4. Slug or Search Term Fallback: Search on both services
    const cleanTerm = input.replace(/https?:\/\//g, '').replace(/[<>"'()]/g, ' ').replace(/[-_]/g, ' ').trim();
    if (cleanTerm.length > 1) {
      // Try MyInstants search first
      const myInstantsResults = await MyInstantsService.search(cleanTerm);
      if (myInstantsResults && myInstantsResults.length > 0) {
        const match = myInstantsResults[0];
        res.json({
          title: match.name,
          url: match.url,
          source: 'myinstants',
          sourceUrl: match.pageUrl,
          tags: match.suggestedTags || ['myinstants', 'meme'],
          color: match.color || '#1a9fff'
        });
        return;
      }

      // Try SoundButtonsWorld search
      const sbwResults = await SoundButtonsWorldService.search(cleanTerm);
      if (sbwResults && sbwResults.length > 0) {
        const match = sbwResults[0];
        res.json({
          title: match.name,
          url: match.url,
          source: 'soundbuttonsworld',
          sourceUrl: match.pageUrl,
          tags: match.suggestedTags || ['soundbuttonsworld', 'meme'],
          color: match.color || '#ff7700'
        });
        return;
      }
    }

    // Fallback direct URL
    const fallbackTitle = input.split('/').pop()?.split('?')[0].replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Som Importado';
    res.json({
      title: fallbackTitle,
      url: input,
      source: 'custom',
      sourceUrl: input,
      tags: ['web', 'importado'],
      color: '#1a9fff'
    });
  } catch (error: any) {
    console.error('Error resolving URL/Button:', error.message);
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
