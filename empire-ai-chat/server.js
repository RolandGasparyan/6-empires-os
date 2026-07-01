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

const { systemFor } = require('./prompts');

// --- Obsidian second-brain: a compact digest of the EMPIRE-Vault injected into
//     every agent's context so answers are grounded in the founder's notes. ---
const BRAIN_PATH = process.env.EMPIRE_BRAIN || '/opt/empire-sync/brain.json';
let BRAIN_CONTEXT = '';
function loadBrain() {
  try {
    const b = JSON.parse(fs.readFileSync(BRAIN_PATH, 'utf8'));
    const digest = (b.notes || []).map((n) => `## ${n.title}\n${n.text}`).join('\n\n').slice(0, 6000);
    BRAIN_CONTEXT = digest ? `\n\n=== EMPIRE SECOND-BRAIN (Obsidian vault — authoritative founder knowledge) ===\n${digest}\n=== END SECOND-BRAIN ===\n` : '';
  } catch { BRAIN_CONTEXT = ''; }
}
loadBrain();
setInterval(loadBrain, 5 * 60 * 1000);   // re-read every 5 min (picks up vault resyncs)

const PORT = process.env.PORT || 8090;
const OLLAMA = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const DEFAULT_MODEL = process.env.EMPIRE_MODEL || 'llama3.2:1b';

// 6-EMPIRE router (VPS) — serves the 8 branded EMPIRE models. Any model whose
// name starts with "empire-" is routed here instead of local Ollama.
const EMPIRE_ROUTER = process.env.EMPIRE_ROUTER || 'http://64.227.6.197:8000/v1';
const EMPIRE_KEY = process.env.EMPIRE_KEY || 'sk-empire-local';
const EMPIRE_MODELS = [
  'empire-prime', 'empire-ceo', 'empire-trading', 'empire-coder',
  'empire-strategist', 'empire-research', 'empire-media', 'empire-fast',
];
const isEmpire = (m) => typeof m === 'string' && m.startsWith('empire-');

// --- Groq frontier routing: when a Groq key is present, EMPIRE models run on a
//     real 70B model (instant + far smarter than the local CPU box) ---
const GROQ_KEY = process.env.FREE_GROQ_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
// stream Groq tokens straight to the browser; returns true if it handled the request
function groqStream(messages, res) {
  return new Promise((resolve) => {
    const https = require('https');
    const data = JSON.stringify({ model: GROQ_MODEL, messages, stream: true, temperature: 0.7 });
    const r = https.request(
      { hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY, 'Content-Length': Buffer.byteLength(data) } },
      (up) => {
        if (up.statusCode !== 200) { let e = ''; up.on('data', (c) => (e += c)); up.on('end', () => resolve(false)); return; }
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
        let buf = '';
        up.on('data', (chunk) => {
          buf += chunk.toString();
          let idx;
          while ((idx = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (payload === '[DONE]') { res.end(); resolve(true); return; }
            try { const j = JSON.parse(payload); const t = j.choices?.[0]?.delta?.content; if (t) res.write(t); } catch {}
          }
        });
        up.on('end', () => { res.end(); resolve(true); });
      }
    );
    r.on('error', () => resolve(false));
    r.write(data); r.end();
  });
}

// Call the EMPIRE router (OpenAI-compatible, non-stream) and return the text.
function empireChat(model, messages) {
  return new Promise((resolve, reject) => {
    const u = new URL(EMPIRE_ROUTER + '/chat/completions');
    const data = JSON.stringify({ model, messages, stream: false });
    const lib = u.protocol === 'https:' ? require('https') : http;
    const r = lib.request(
      { hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80), path: u.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + EMPIRE_KEY, 'Content-Length': Buffer.byteLength(data) } },
      (res) => { let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => {
        try { resolve(JSON.parse(b).choices[0].message.content); } catch (e) { reject(e); } }); }
    );
    r.on('error', reject); r.write(data); r.end();
  });
}

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
  // Normalize the URL so the app works whether mounted at "/" or behind "/chat".
  // nginx proxies /chat → here without stripping, so strip a leading /chat ourselves.
  let url = req.url.replace(/^\/chat(?=\/|$)/, '') || '/';
  if (url === '') url = '/';

  // --- UI ---
  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(INDEX);
  }

  // --- brand marks (served from the app dir so the logo always loads) ---
  if (req.method === 'GET' && (url === '/empire-mark.svg' || url === '/empire-symbol.svg')) {
    try {
      const svg = fs.readFileSync(path.join(__dirname, url.slice(1)));
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
      return res.end(svg);
    } catch { res.writeHead(404); return res.end(); }
  }
  // --- marble background ---
  if (req.method === 'GET' && url === '/marble-bg.svg') {
    try {
      const svg = fs.readFileSync(path.join(__dirname, 'marble-bg.svg'));
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
      return res.end(svg);
    } catch { res.writeHead(404); return res.end(); }
  }
  // --- real EMPIRE logo PNG ---
  if (req.method === 'GET' && url === '/empire-logo.png') {
    try {
      const png = fs.readFileSync(path.join(__dirname, 'empire-logo.png'));
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
      return res.end(png);
    } catch { res.writeHead(404); return res.end(); }
  }

  // --- health ---
  if (req.method === 'GET' && url === '/api/health') {
    try {
      const tags = await ollama('/api/tags', 'GET');
      const local = JSON.parse(tags.body).models?.map((m) => m.name) || [];
      // EMPIRE models first, then any local Ollama models.
      const models = [...EMPIRE_MODELS, ...local];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, ollama: 'up', models }));
    } catch (e) {
      // Ollama down locally — still expose the EMPIRE (VPS) models.
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, ollama: 'down', models: EMPIRE_MODELS }));
    }
  }

  // --- list models ---
  if (req.method === 'GET' && url === '/api/models') {
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
  if (req.method === 'POST' && url === '/api/chat') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      let payload;
      try { payload = JSON.parse(raw); } catch { payload = {}; }
      const model = payload.model || DEFAULT_MODEL;
      const mode = payload.mode || 'god';
      const incoming = payload.messages || [];
      // Compose the system prompt: mode (GOD MODE/academic/etc.) + the Obsidian
      // second-brain + the agent's OWN persona/skills system message (kept!).
      const clientSys = incoming.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
      const sysContent = systemFor(mode) + BRAIN_CONTEXT + (clientSys ? `\n\n=== AGENT PERSONA ===\n${clientSys}` : '');
      const sys = { role: 'system', content: sysContent };
      const messages = [sys, ...incoming.filter((m) => m.role !== 'system')];

      // EMPIRE models → prefer Groq frontier (70B, instant) when a key is set;
      // fall back to the local VPS router if Groq is unavailable.
      if (isEmpire(model)) {
        if (GROQ_KEY) {
          groqStream(messages, res).then((ok) => {
            if (ok) return;
            // Groq failed → fall back to local router (non-stream)
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
            empireChat(model, messages).then((t) => res.end(t)).catch((e) => res.end('⚠️ router unreachable: ' + e.message));
          });
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
        empireChat(model, messages)
          .then((text) => res.end(text))
          .catch((e) => res.end('⚠️ EMPIRE router unreachable: ' + e.message));
        return;
      }

      const u = new URL(OLLAMA);
      const data = JSON.stringify({ model, messages, stream: true, options: { temperature: 0.7, num_ctx: 8192 } });
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
