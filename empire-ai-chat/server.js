/**
 * EMPIRE AI — private chat server.
 * Zero-dependency Node HTTP server. Serves the gold EMPIRE AI UI and proxies
 * chat completions to a local Ollama instance (http://127.0.0.1:11434).
 * Streams tokens back to the browser via Server-Sent-Events-style chunks.
 *
 * Env:
 *   PORT          (default 8090)
 *   OLLAMA_URL    (default http://127.0.0.1:11434)
 *   EMPIRE_MODEL  (default llama3.2:1b)  — fallback model if client sends none
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8090;
const OLLAMA = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.EMPIRE_MODEL || 'llama3.2:1b';

const INDEX = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function ollama(reqPath, method, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(OLLAMA);
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(
      { hostname: u.hostname, port: u.port || 11434, path: reqPath, method,
        headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} },
      (res) => { let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => resolve({ status: res.statusCode, body: b })); }
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

const server = http.createServer(async (req, res) => {
  // --- UI ---
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(INDEX);
  }

  // --- brand mark (served from the app dir so the logo always loads) ---
  if (req.method === 'GET' && req.url === '/empire-mark.svg') {
    try {
      const svg = fs.readFileSync(path.join(__dirname, 'empire-mark.svg'));
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
      return res.end(svg);
    } catch { res.writeHead(404); return res.end(); }
  }

  // --- health ---
  if (req.method === 'GET' && req.url === '/api/health') {
    try {
      const tags = await ollama('/api/tags', 'GET');
      const models = JSON.parse(tags.body).models?.map((m) => m.name) || [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, ollama: 'up', models }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, ollama: 'down', error: String(e) }));
    }
  }

  // --- list models ---
  if (req.method === 'GET' && req.url === '/api/models') {
    try {
      const tags = await ollama('/api/tags', 'GET');
      const models = JSON.parse(tags.body).models?.map((m) => m.name) || [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ models }));
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ models: [], error: String(e) }));
    }
  }

  // --- streaming chat ---
  if (req.method === 'POST' && req.url === '/api/chat') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(raw); } catch { payload = {}; }
      const model = payload.model || DEFAULT_MODEL;
      const messages = payload.messages || [];
      const u = new URL(OLLAMA);
      const data = JSON.stringify({ model, messages, stream: true });
      const upstream = http.request(
        { hostname: u.hostname, port: u.port || 11434, path: '/api/chat', method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
        (up) => {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
          up.on('data', (chunk) => {
            // Ollama streams newline-delimited JSON; forward message.content tokens
            chunk.toString().split('\n').filter(Boolean).forEach((line) => {
              try { const j = JSON.parse(line); if (j.message?.content) res.write(j.message.content); } catch {}
            });
          });
          up.on('end', () => res.end());
        }
      );
      upstream.on('error', (e) => { res.writeHead(502, { 'Content-Type': 'text/plain' }); res.end('⚠️ Model backend unreachable: ' + e.message); });
      upstream.write(data);
      upstream.end();
    });
    return;
  }

  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => console.log(`EMPIRE AI chat on :${PORT} → Ollama ${OLLAMA} (default ${DEFAULT_MODEL})`));
