const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '256kb' }));

app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html') || req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});


const ROOT = __dirname;
const SCORE_FILE = path.join(ROOT, 'data', 'highscore.json');

function readScore() {
  try {
    const raw = fs.readFileSync(SCORE_FILE, 'utf8');
    const j = JSON.parse(raw);
    const maxDogs = Number(j.maxDogs || 1);
    return { maxDogs: Number.isFinite(maxDogs) && maxDogs > 0 ? maxDogs : 1, updatedAt: j.updatedAt || '' };
  } catch {
    return { maxDogs: 1, updatedAt: '' };
  }
}

function writeScore(score) {
  fs.writeFileSync(SCORE_FILE, JSON.stringify(score, null, 2));
}

app.get('/api/highscore', (req, res) => {
  res.json({ ok: true, ...readScore() });
});

app.post('/api/highscore', (req, res) => {
  const n = Number(req.body?.maxDogs || 0);
  if (!Number.isFinite(n) || n < 1) return res.status(400).json({ ok: false, error: 'invalid_maxDogs' });

  const current = readScore();
  if (n > current.maxDogs) {
    const next = { maxDogs: n, updatedAt: new Date().toISOString() };
    writeScore(next);
    return res.json({ ok: true, updated: true, ...next });
  }
  return res.json({ ok: true, updated: false, ...current });
});

app.use(express.static(ROOT));
app.get('*', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

const PORT = Number(process.env.PORT || 8000);
app.listen(PORT, '0.0.0.0', () => {
  console.log('chicken_game server on', PORT);
});
