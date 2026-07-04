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
// Keys live in a shared JSON file that the admin page (/keys) writes, so updates
// take effect instantly with NO restart. Falls back to the env var.
const KEYS_FILE = process.env.KEYS_FILE || '/root/6-empires-os-full/apps/api/keys.json';
const _fsk = require('fs');
function readKeys() { try { return JSON.parse(_fsk.readFileSync(KEYS_FILE, 'utf8')); } catch { return {}; } }
function readGroqKey() { const k = (readKeys().FREE_GROQ_KEY || '').trim(); return k || (process.env.FREE_GROQ_KEY || ''); }
function adminPass() { return (readKeys().admin_pass || process.env.ADMIN_PASS || 'EMPIRE_KEYS_2026'); }
let GROQ_KEY = readGroqKey();          // refreshed at the top of every request
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

const KEYS_PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EMPIRE · API Keys</title><style>
*{box-sizing:border-box}body{margin:0;background:#05060a;color:#FDC72C;font-family:'Chakra Petch',system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
.card{width:100%;max-width:440px;background:rgba(10,12,18,.96);border:1px solid rgba(253,199,44,.25);border-radius:14px;padding:28px;box-shadow:0 12px 48px rgba(0,0,0,.6)}
h1{font-size:18px;letter-spacing:.22em;margin:0 0 4px}.sub{font-size:11px;color:rgba(253,199,44,.5);margin:0 0 20px;letter-spacing:.1em}
label{display:block;font-size:11px;letter-spacing:.14em;margin:14px 0 6px;color:rgba(253,199,44,.75)}
input{width:100%;padding:11px 12px;background:rgba(253,199,44,.06);border:1px solid rgba(253,199,44,.28);border-radius:7px;color:#FDC72C;font-family:'Space Mono',monospace;font-size:13px}
input:focus{outline:none;border-color:#FDC72C}
button{width:100%;margin-top:18px;padding:12px;background:#FDC72C;color:#05060a;border:none;border-radius:7px;font-weight:700;letter-spacing:.14em;font-size:13px;cursor:pointer}
button:disabled{opacity:.5;cursor:default}
.row{display:flex;gap:8px;align-items:center;margin-top:14px;font-size:12px}
.msg{margin-top:14px;font-size:12px;line-height:1.5;min-height:18px}
.ok{color:#4ade80}.err{color:#f87171}.muted{color:rgba(253,199,44,.5)}
.status{margin-top:8px;font-family:'Space Mono',monospace;font-size:12px;color:rgba(253,199,44,.7)}
</style></head><body><div class="card">
<h1>◆ EMPIRE · API KEYS</h1><p class="sub">Fill only what you want to change, then SAVE ALL. Applies live — no restart. Blank = keep current.</p>
<label>ADMIN PASSWORD</label><input id="pass" type="password" placeholder="admin password" autocomplete="off">
<label>GROQ <span class="muted" id="c_FREE_GROQ_KEY"></span></label><input data-key="FREE_GROQ_KEY" type="text" placeholder="gsk_..." autocomplete="off" spellcheck="false">
<label>OPENAI <span class="muted" id="c_OPENAI_API_KEY"></span></label><input data-key="OPENAI_API_KEY" type="text" placeholder="sk-..." autocomplete="off" spellcheck="false">
<label>ANTHROPIC <span class="muted" id="c_ANTHROPIC_API_KEY"></span></label><input data-key="ANTHROPIC_API_KEY" type="text" placeholder="sk-ant-..." autocomplete="off" spellcheck="false">
<label>COMPOSIO <span class="muted" id="c_COMPOSIO_API_KEY"></span></label><input data-key="COMPOSIO_API_KEY" type="text" placeholder="composio key" autocomplete="off" spellcheck="false">
<button id="save" onclick="save()">SAVE ALL &amp; APPLY</button>
<div class="row"><button style="margin:0;background:none;border:1px solid rgba(253,199,44,.3);color:#FDC72C" onclick="status()">CHECK CURRENT</button></div>
<div id="msg" class="msg muted">Groq / OpenAI / Anthropic keys are live-validated before saving.</div>
</div><script>
const api=(p)=>location.pathname.replace(/\\/keys.*$/,'').replace(/\\/admin.*$/,'')+p;
function inputs(){return Array.from(document.querySelectorAll('input[data-key]'));}
async function status(){const pass=document.getElementById('pass').value;const msg=document.getElementById('msg');msg.textContent='checking…';msg.className='msg muted';
 try{const r=await fetch(api('/api/admin/status'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass})});const j=await r.json();
 if(!j.ok){msg.textContent='✗ '+(j.error||'error');msg.className='msg err';return;}
 for(const k in j.keys){const el=document.getElementById('c_'+k);if(el)el.textContent='· '+j.keys[k];}
 msg.textContent='Current keys shown next to each label.';msg.className='msg ok';}catch(e){msg.textContent='✗ '+e;msg.className='msg err';}}
async function save(){const pass=document.getElementById('pass').value;const keys={};inputs().forEach(i=>{const v=i.value.trim();if(v)keys[i.dataset.key]=v;});
 const msg=document.getElementById('msg');const btn=document.getElementById('save');
 if(!Object.keys(keys).length){msg.textContent='Fill at least one key.';msg.className='msg err';return;}
 btn.disabled=true;msg.textContent='Validating & saving…';msg.className='msg muted';
 try{const r=await fetch(api('/api/admin/save'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pass,keys})});const j=await r.json();
 if(j.ok){msg.innerHTML=Object.entries(j.results).map(([k,v])=>k+': '+v).join('<br>');msg.className='msg '+(JSON.stringify(j.results).includes('✗')?'err':'ok');inputs().forEach(i=>i.value='');status();}
 else{msg.textContent='✗ '+(j.error||'failed');msg.className='msg err';}}catch(e){msg.textContent='✗ '+e;msg.className='msg err';}
 btn.disabled=false;}
</script></body></html>`;

const server = http.createServer(async (req, res) => {
  // Normalize the URL so the app works whether mounted at "/" or behind "/chat".
  // nginx proxies /chat → here without stripping, so strip a leading /chat ourselves.
  let url = req.url.replace(/^\/chat(?=\/|$)/, '') || '/';
  url = url.split('?')[0];
  if (url === '') url = '/';

  // Always use the latest saved Groq key (admin page can change it live).
  GROQ_KEY = readGroqKey();

  // --- ADMIN: API-key manager page (password-gated) ---
  if (req.method === 'GET' && (url === '/keys' || url === '/admin')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(KEYS_PAGE);
  }
  // All keys the manager knows about. `validate` keys are live-checked before save.
  const KEY_DEFS = [
    { id: 'FREE_GROQ_KEY',    label: 'Groq',      prefix: 'gsk_',      validate: 'groq' },
    { id: 'OPENAI_API_KEY',   label: 'OpenAI',    prefix: 'sk-',       validate: 'openai' },
    { id: 'ANTHROPIC_API_KEY',label: 'Anthropic', prefix: 'sk-ant-',   validate: 'anthropic' },
    { id: 'COMPOSIO_API_KEY', label: 'Composio',  prefix: '',          validate: null },
  ];
  const mask = (k) => k ? (k.slice(0, 8) + '…' + k.slice(-4)) : '';
  async function validateKey(kind, key) {
    try {
      if (kind === 'groq') { const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { 'Authorization': 'Bearer ' + key } }); return r.ok; }
      if (kind === 'openai') { const r = await fetch('https://api.openai.com/v1/models', { headers: { 'Authorization': 'Bearer ' + key } }); return r.ok; }
      if (kind === 'anthropic') { const r = await fetch('https://api.anthropic.com/v1/models', { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } }); return r.ok; }
    } catch { return false; }
    return true; // no validator → accept
  }
  if (req.method === 'POST' && url === '/api/admin/status') {
    let raw = ''; req.on('data', c => raw += c); req.on('end', () => {
      let b = {}; try { b = JSON.parse(raw); } catch {}
      if ((b.pass || '') !== adminPass()) { res.writeHead(403, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: false, error: 'wrong password' })); }
      const cur = readKeys();
      const out = {};
      for (const d of KEY_DEFS) { const v = (d.id === 'FREE_GROQ_KEY') ? readGroqKey() : (cur[d.id] || ''); out[d.id] = v ? mask(v) : '(none)'; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, keys: out }));
    });
    return;
  }
  if (req.method === 'POST' && url === '/api/admin/save') {
    let raw = ''; req.on('data', c => raw += c); req.on('end', async () => {
      let b = {}; try { b = JSON.parse(raw); } catch {}
      if ((b.pass || '') !== adminPass()) { res.writeHead(403, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: false, error: 'wrong password' })); }
      const incoming = b.keys || {};
      const cur = readKeys(); if (!cur.admin_pass) cur.admin_pass = adminPass();
      const results = {};
      for (const d of KEY_DEFS) {
        const val = (incoming[d.id] || '').trim();
        if (!val) continue;                                   // only update fields the user filled
        if (d.prefix && !val.startsWith(d.prefix)) { results[d.label] = '✗ must start with ' + d.prefix; continue; }
        if (d.validate) { const ok = await validateKey(d.validate, val); if (!ok) { results[d.label] = '✗ rejected by ' + d.label + ' (invalid)'; continue; } }
        cur[d.id] = val;
        results[d.label] = '✓ saved ' + mask(val);
      }
      try { _fsk.writeFileSync(KEYS_FILE, JSON.stringify(cur, null, 2)); } catch (e) { res.writeHead(500, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: false, error: 'write failed: ' + e.message })); }
      GROQ_KEY = readGroqKey();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, results }));
    });
    return;
  }

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
  if (req.method === 'GET' && url === '/empire-emblem.png') {
    try {
      const png = fs.readFileSync(path.join(__dirname, 'empire-emblem.png'));
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' });
      return res.end(png);
    } catch { res.writeHead(404); return res.end(); }
  }
  if (req.method === 'GET' && url === '/empire-logo.png') {
    try {
      const png = fs.readFileSync(path.join(__dirname, 'empire-logo.png'));
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache, no-store, must-revalidate' });
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

      // EMPIRE models → HYBRID (option 3): trivial greetings stay 100% local/private
      // on your own VPS; anything substantive escalates to the Groq big brain (70B)
      // for ChatGPT-class answers. Bulletproof cross-fallback so it never dead-ends.
      if (isEmpire(model)) {
        const lastUser = (incoming.filter((m) => m.role === 'user').pop() || {}).content || '';
        const isGreeting = /^\s*(hi|hey+|hello|yo|sup|barev|привет|ok|okay|k|thanks|thank you|ty|lol|nice|cool|good|great|bye|👍)[\s!.,?]*$/i.test(lastUser);
        // Privacy routing mode chosen by the user in the UI (persisted client-side):
        //   'local'  → everything on your VPS (private, slower)
        //   'cloud'  → everything on Groq 70B (fastest, best quality)
        //   'hybrid' → greetings local, real questions Groq (default)
        const route = String(payload.route || 'hybrid').toLowerCase();
        let useGroq;
        if (route === 'local') useGroq = false;
        else if (route === 'cloud' || route === 'groq') useGroq = !!GROQ_KEY;
        else useGroq = GROQ_KEY && !isGreeting;

        const localFallback = () => {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
          empireChat(model, messages).then((t) => res.end(t || '…')).catch((e) => res.end('⚠️ router unreachable: ' + e.message));
        };

        if (useGroq) {
          groqStream(messages, res).then((ok) => { if (!ok) localFallback(); });
          return;
        }
        // greeting (or no Groq key) → local/private router (which is itself hybrid)
        localFallback();
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

  // --- speech-to-text (Groq Whisper) — browser records mic audio, we transcribe ---
  if (req.method === 'POST' && url === '/api/stt') {
    const _chunks = [];
    req.on('data', (c) => _chunks.push(c));
    req.on('end', async () => {
      try {
        if (!GROQ_KEY) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ text: '', error: 'no STT key' })); }
        const buf = Buffer.concat(_chunks);
        const ctype = req.headers['content-type'] || 'audio/webm';
        const ext = ctype.indexOf('ogg') >= 0 ? 'ogg' : (ctype.indexOf('mp4') >= 0 ? 'mp4' : 'webm');
        const fd = new FormData();
        fd.append('file', new Blob([buf], { type: ctype }), 'audio.' + ext);
        fd.append('model', 'whisper-large-v3-turbo');
        fd.append('response_format', 'json');
        fd.append('temperature', '0');
        const gr = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { 'Authorization': 'Bearer ' + GROQ_KEY }, body: fd });
        const j = await gr.json().catch(() => ({}));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: (j.text || '').trim(), err: gr.ok ? undefined : (j.error && j.error.message) }));
      } catch (e) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: '', error: String(e) }));
      }
    });
    return;
  }

  // --- text-to-speech: local Piper neural (hy_AM-gor-medium, self-hosted, no account needed)
  // -> Azure Neural (hy-AM) if AZURE_SPEECH_KEY/REGION configured -> eSpeak-NG as last resort ---
  if (req.method === 'POST' && url === '/api/tts') {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', async () => {
      let p = {}; try { p = JSON.parse(raw); } catch {}
      let text = (p.text || '').toString().replace(/[*#`>_~|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 900);
      const langMap = { hy: 'hy', hyw: 'hyw', ru: 'ru', en: 'en' };
      const voice = langMap[p.lang] || 'hy';
      if (!text) { res.writeHead(400); return res.end(); }

      const PIPER_BIN = process.env.PIPER_BIN || '/opt/piper-hy/piper/piper';
      const PIPER_MODEL = process.env.PIPER_MODEL || '/opt/piper-hy/hy_AM-gor-medium.onnx';
      const PIPER_CONFIG = process.env.PIPER_CONFIG || '/opt/piper-hy/hy_AM-gor-medium.onnx.json';
      const fs = require('fs');
      const piperAvailable = (voice === 'hy' || voice === 'hyw') && fs.existsSync(PIPER_BIN) && fs.existsSync(PIPER_MODEL);

      const AZ_KEY = process.env.AZURE_SPEECH_KEY;
      const AZ_REGION = process.env.AZURE_SPEECH_REGION;
      const azureVoiceMap = { hy: 'hy-AM-AnahitNeural', hyw: 'hy-AM-AnahitNeural', ru: 'ru-RU-SvetlanaNeural', en: 'en-US-JennyNeural' };

      function piperTTS(t) {
        return new Promise((resolve, reject) => {
          const { spawn } = require('child_process');
          const outPath = `/tmp/piper-out-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`;
          const ch = spawn(PIPER_BIN, ['-m', PIPER_MODEL, '-c', PIPER_CONFIG, '--output_file', outPath]);
          let errBuf = '';
          ch.stderr.on('data', (d) => (errBuf += d));
          ch.on('error', reject);
          ch.on('close', (code) => {
            try {
              const buf = fs.readFileSync(outPath);
              fs.unlink(outPath, () => {});
              if (code !== 0 || !buf.length) return reject(new Error('piper exited ' + code + ': ' + errBuf));
              resolve(buf);
            } catch (e) { reject(e); }
          });
          ch.stdin.write(t); ch.stdin.end();
        });
      }

      async function azureTTS(t, lang) {
        const voiceName = azureVoiceMap[lang] || azureVoiceMap.hy;
        const tokRes = await fetch(`https://${AZ_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
          method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': AZ_KEY }
        });
        if (!tokRes.ok) throw new Error('azure token failed: ' + tokRes.status);
        const token = await tokRes.text();
        const esc = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const ssml = `<speak version='1.0' xml:lang='hy-AM'><voice name='${voiceName}'>${esc}</voice></speak>`;
        const ttsRes = await fetch(`https://${AZ_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
            'User-Agent': 'empire-ai-chat'
          },
          body: ssml
        });
        if (!ttsRes.ok) throw new Error('azure tts failed: ' + ttsRes.status);
        return Buffer.from(await ttsRes.arrayBuffer());
      }

      function espeakTTS(t, v) {
        return new Promise((resolve, reject) => {
          const { spawn } = require('child_process');
          const ch = spawn('espeak-ng', ['-v', v, '-s', '155', '-p', '42', '--stdout']);
          const bufs = [];
          ch.stdout.on('data', (d) => bufs.push(d));
          ch.on('error', reject);
          ch.on('close', () => resolve(Buffer.concat(bufs)));
          ch.stdin.write(t); ch.stdin.end();
        });
      }

      try {
        let wav;
        if (piperAvailable) {
          try { wav = await piperTTS(text); }
          catch (e) {
            console.error('[tts] piper failed, falling back:', e.message);
            if (AZ_KEY && AZ_REGION) { try { wav = await azureTTS(text, p.lang); } catch (e2) { wav = await espeakTTS(text, voice); } }
            else { wav = await espeakTTS(text, voice); }
          }
        } else if (AZ_KEY && AZ_REGION) {
          try { wav = await azureTTS(text, p.lang); }
          catch (e) { console.error('[tts] azure failed, falling back to espeak-ng:', e.message); wav = await espeakTTS(text, voice); }
        } else {
          wav = await espeakTTS(text, voice);
        }
        res.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': wav.length, 'Cache-Control': 'no-store' });
        res.end(wav);
      } catch (e) {
        res.writeHead(500); res.end();
      }
    });
    return;
  }

  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => console.log(`EMPIRE AI chat on :${PORT} → Ollama ${OLLAMA} (default ${DEFAULT_MODEL})`));
