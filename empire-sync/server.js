/**
 * 6-EMPIRE — GitHub Sync Service
 * Polls the founder's repositories and exposes a single live state.json that
 * the 3D world + dashboards read. Zero dependencies (Node 18+ global fetch).
 *
 * Env (/opt/empire-sync/.env):
 *   GITHUB_TOKEN   fine-grained PAT, Contents+Metadata+Issues read-only
 *   GITHUB_OWNER   default: RolandGasparyan
 *   SYNC_PORT      default: 8120
 *   SYNC_REPOS     comma list (default: the 5 empire repos)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// load .env (simple parser)
try {
  const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  env.split('\n').forEach((l) => { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
} catch {}

const TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = process.env.GITHUB_OWNER || 'RolandGasparyan';
const PORT = process.env.SYNC_PORT || 8120;
const REPOS = (process.env.SYNC_REPOS || '6-empires-os,trading-guru-empire,strategy-lab-mac,dzayn-app')
  .split(',').map((s) => s.trim()).filter(Boolean);

const STATE_FILE = path.join(__dirname, 'state.json');
let state = { ok: false, updated: null, owner: OWNER, repos: [], note: 'awaiting first sync' };
try { state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}

function gh(p) {
  const tok = process.env.GITHUB_TOKEN || TOKEN;   // live token (updated by setup form)
  return fetch('https://api.github.com' + p, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': '6-empire-sync',
      ...(tok ? { 'Authorization': 'Bearer ' + tok } : {}),
    },
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
}

// derive a coarse "stage" + progress from recent activity
function stageFor(repo) {
  const days = repo.lastPushDays;
  if (days == null) return { stage: 'IDEA', prog: 0.15 };
  if (days < 2) return { stage: 'LIVE', prog: 0.82 };
  if (days < 7) return { stage: 'BUILDING', prog: 0.6 };
  if (days < 30) return { stage: 'BETA', prog: 0.45 };
  return { stage: 'PAUSED', prog: 0.3 };
}

async function syncOnce() {
  if (!(process.env.GITHUB_TOKEN || TOKEN)) { state = { ...state, ok: false, updated: new Date().toISOString(), note: 'no GITHUB_TOKEN set' }; return; }
  // AUTO-DISCOVER: list every repo the token can see, then sync the configured
  // ones if present plus any others the token grants (so names always match).
  let repoNames = REPOS.slice();
  try {
    const disc = await gh('/user/repos?per_page=100&affiliation=owner,collaborator&sort=pushed');
    if (Array.isArray(disc.body) && disc.body.length) {
      const all = disc.body.map((r) => r.name);
      // keep configured names that exist + add any extra accessible repos (cap 12)
      const exist = REPOS.filter((n) => all.includes(n));
      const extras = all.filter((n) => !REPOS.includes(n));
      repoNames = [...new Set([...exist, ...extras])].slice(0, 12);
    }
  } catch {}
  const out = [];
  for (const name of repoNames) {
    try {
      const { status, body } = await gh(`/repos/${OWNER}/${name}`);
      if (status !== 200 || !body) { out.push({ name, error: 'status ' + status }); continue; }
      const pushedAt = body.pushed_at ? new Date(body.pushed_at) : null;
      const lastPushDays = pushedAt ? Math.floor((Date.now() - pushedAt.getTime()) / 86400000) : null;
      const commitsRes = await gh(`/repos/${OWNER}/${name}/commits?per_page=1`);
      const lastCommit = Array.isArray(commitsRes.body) && commitsRes.body[0]
        ? { msg: commitsRes.body[0].commit.message.split('\n')[0], date: commitsRes.body[0].commit.author.date }
        : null;
      const issuesRes = await gh(`/repos/${OWNER}/${name}/issues?state=open&per_page=1`);
      const repo = {
        name, url: body.html_url, desc: body.description || '',
        stars: body.stargazers_count, openIssues: body.open_issues_count,
        language: body.language, lastPush: body.pushed_at, lastPushDays, lastCommit,
      };
      out.push({ ...repo, ...stageFor(repo) });
    } catch (e) { out.push({ name, error: String(e) }); }
  }
  state = { ok: true, updated: new Date().toISOString(), owner: OWNER, repos: out };
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log('[sync] ok', new Date().toISOString(), out.map((r) => r.name + ':' + (r.stage || r.error)).join(' '));
}

function readBrain() {
  try { return fs.readFileSync(path.join(__dirname, 'brain.json'), 'utf8'); }
  catch { return JSON.stringify({ source: 'EMPIRE-Vault', noteCount: 0, notes: [] }); }
}

const SETUP_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>6-EMPIRE · GitHub Token</title>
<style>body{margin:0;background:#000;color:#f3ecd9;font-family:-apple-system,system-ui,sans-serif;display:grid;place-items:center;height:100dvh}
.card{width:min(460px,92vw);background:#0c0b09;border:1px solid #caa44a55;border-radius:18px;padding:28px}
h1{color:#d4af37;font-size:20px;letter-spacing:.1em;margin:0 0 6px}p{color:#8a8270;font-size:13px;line-height:1.5}
input{width:100%;box-sizing:border-box;margin:14px 0;padding:12px 14px;border-radius:12px;border:1px solid #caa44a55;background:#15130d;color:#f3ecd9;font-size:14px}
button{width:100%;padding:13px;border:0;border-radius:12px;background:linear-gradient(135deg,#f4d98b,#c8941a);color:#0a0a0b;font-weight:700;font-size:15px;cursor:pointer}
.ok{color:#34f5a0}.err{color:#ff6a8a}small{color:#6f6857}</style></head><body>
<div class="card"><h1>🔐 CONNECT GITHUB</h1>
<p>Paste your GitHub <b>fine-grained token</b> (Contents + Metadata + Issues read-only on your empire repos). It is saved only on this server and never leaves it.</p>
<input id="t" type="password" placeholder="github_pat_… or ghp_…" autocomplete="off">
<button onclick="save()">Save &amp; Sync</button>
<p style="margin-top:22px"><b style="color:#34f5a0">⚡ FAST MODELS (optional)</b><br>Paste a free <b>Groq</b> key (console.groq.com/keys) to make every agent answer in &lt;1s.</p>
<input id="g" type="password" placeholder="gsk_… (Groq key)" autocomplete="off">
<button style="background:linear-gradient(135deg,#7dd87d,#1f8a4c)" onclick="saveGroq()">Save Groq Key</button>
<p style="margin-top:22px"><b style="color:#6fb3ff">🤖 AUTONOMOUS PRs (optional)</b><br>Paste a GitHub token with <b>Contents + Pull requests = Write</b> to let agents open real Pull Requests (never pushes to main).</p>
<input id="w" type="password" placeholder="github_pat_… (write token)" autocomplete="off">
<button style="background:linear-gradient(135deg,#6fb3ff,#2f5fd0)" onclick="saveWrite()">Enable Agent PRs</button>
<p id="status" style="margin-top:18px;padding:10px 12px;border:1px solid #caa44a33;border-radius:10px;font-size:12.5px;color:#9fdce6"></p>
<p id="msg"></p><small>Secrets stored at /opt/empire-sync/.env · never leave this server.</small></div>
<script>
// show which token is live + how many repos it currently sees
(async()=>{try{const r=await fetch('/api/empire/state');const j=await r.json();const ok=(j.repos||[]).filter(x=>!x.error).length;const s=document.getElementById('status');s.innerHTML='Active token tail: <b>…'+(j.tokenTail||'?')+'</b> · sees <b>'+ok+'</b> repo'+(ok==1?'':'s')+(ok<4?' — needs All-repos + Contents/Metadata read':' ✓');}catch(e){}})();
async function save(){const t=document.getElementById('t').value.trim();const m=document.getElementById('msg');if(!t){m.textContent='Enter a token.';return}m.textContent='Saving…';try{const r=await fetch('/api/empire/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t})});const j=await r.json();if(j.ok){m.className='ok';m.textContent='✓ Connected! '+(j.synced||0)+' repos syncing.';}else{m.className='err';m.textContent='⚠ '+(j.error||'failed');}}catch(e){m.className='err';m.textContent='⚠ '+e.message}}
async function saveGroq(){const g=document.getElementById('g').value.trim();const m=document.getElementById('msg');if(!g){m.textContent='Enter a Groq key.';return}m.textContent='Saving…';try{const r=await fetch('/api/empire/groq',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:g})});const j=await r.json();if(j.ok){m.className='ok';m.textContent='⚡ Groq key saved — agents are now fast.';}else{m.className='err';m.textContent='⚠ '+(j.error||'failed');}}catch(e){m.className='err';m.textContent='⚠ '+e.message}}
async function saveWrite(){const w=document.getElementById('w').value.trim();const m=document.getElementById('msg');if(!w){m.textContent='Enter a write token.';return}m.textContent='Saving…';try{const r=await fetch('/api/empire/writetoken',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:w})});const j=await r.json();if(j.ok){m.className='ok';m.textContent='🤖 Agent PRs enabled — agents will open Pull Requests.';fetch('/api/empire/agents/run',{method:'POST'});}else{m.className='err';m.textContent='⚠ '+(j.error||'failed');}}catch(e){m.className='err';m.textContent='⚠ '+e.message}}
</script>
</body></html>`;
const { execSync } = require('child_process');
const agents = require('./agents');

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // --- token setup page (browser form; token goes browser → this server only) ---
  if (req.method === 'GET' && req.url.startsWith('/api/empire/setup')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(SETUP_HTML);
  }
  if (req.method === 'POST' && req.url.startsWith('/api/empire/setup')) {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', async () => {
      try {
        const tok = (JSON.parse(body).token || '').trim();
        if (!/^(github_pat_|ghp_)/.test(tok)) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: false, error: 'token must start with github_pat_ or ghp_' })); }
        // write .env preserving the other keys
        const envPath = path.join(__dirname, '.env');
        let env = ''; try { env = fs.readFileSync(envPath, 'utf8'); } catch {}
        if (/^GITHUB_TOKEN=.*$/m.test(env)) env = env.replace(/^GITHUB_TOKEN=.*$/m, 'GITHUB_TOKEN=' + tok);
        else env += (env.endsWith('\n') || !env ? '' : '\n') + 'GITHUB_TOKEN=' + tok + '\n';
        fs.writeFileSync(envPath, env);
        process.env.GITHUB_TOKEN = tok; // hot-reload for this process
        await syncOnce();
        const okCount = (state.repos || []).filter((r) => !r.error).length;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, synced: okCount }));
      } catch (e) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: String(e) })); }
    });
    return;
  }
  // --- Groq fast-model key (browser → server only) ---
  if (req.method === 'POST' && req.url.startsWith('/api/empire/groq')) {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const key = (JSON.parse(body).key || '').trim();
        if (!/^gsk_/.test(key)) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: false, error: 'Groq key must start with gsk_' })); }
        const envPath = path.join(__dirname, '.env');
        let env = ''; try { env = fs.readFileSync(envPath, 'utf8'); } catch {}
        if (/^FREE_GROQ_KEY=.*$/m.test(env)) env = env.replace(/^FREE_GROQ_KEY=.*$/m, 'FREE_GROQ_KEY=' + key);
        else env += (env.endsWith('\n') || !env ? '' : '\n') + 'FREE_GROQ_KEY=' + key + '\n';
        fs.writeFileSync(envPath, env);
        // also write to the main stack .env so the router picks it up
        try { execSync(`grep -q '^FREE_GROQ_KEY=' /root/6-empires-os-full/.env 2>/dev/null && sed -i 's#^FREE_GROQ_KEY=.*#FREE_GROQ_KEY=${key}#' /root/6-empires-os-full/.env || echo 'FREE_GROQ_KEY=${key}' >> /root/6-empires-os-full/.env`); } catch {}
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: String(e) })); }
    });
    return;
  }
  // --- AUTONOMOUS AGENTS: state + run + write-token ---
  if (req.method === 'GET' && req.url.startsWith('/api/empire/agents/state')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(agents.readState()));
  }
  if (req.method === 'POST' && req.url.startsWith('/api/empire/agents/run')) {
    agents.runAll().then((s) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(s)); })
      .catch((e) => { res.writeHead(500); res.end(String(e)); });
    return;
  }
  if (req.method === 'POST' && req.url.startsWith('/api/empire/writetoken')) {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const key = (JSON.parse(body).token || '').trim();
        if (!/^(github_pat_|ghp_)/.test(key)) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: false, error: 'token must start with github_pat_ or ghp_' })); }
        const envPath = path.join(__dirname, '.env');
        let env = ''; try { env = fs.readFileSync(envPath, 'utf8'); } catch {}
        if (/^GITHUB_WRITE_TOKEN=.*$/m.test(env)) env = env.replace(/^GITHUB_WRITE_TOKEN=.*$/m, 'GITHUB_WRITE_TOKEN=' + key);
        else env += (env.endsWith('\n') || !env ? '' : '\n') + 'GITHUB_WRITE_TOKEN=' + key + '\n';
        fs.writeFileSync(envPath, env);
        process.env.GITHUB_WRITE_TOKEN = key;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: String(e) })); }
    });
    return;
  }
  // --- GitHub webhook → instant re-sync (point a repo webhook here) ---
  if (req.method === 'POST' && req.url.startsWith('/api/empire/webhook')) {
    let body = ''; req.on('data', (c) => (body += c));
    req.on('end', () => { syncOnce().then(() => { res.writeHead(200); res.end('resynced'); }).catch(() => { res.writeHead(200); res.end('ok'); }); });
    return;
  }
  if (req.url.startsWith('/api/empire/brain')) {          // Obsidian second-brain
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(readBrain());
  }
  if (req.url.startsWith('/api/empire/state') || req.url === '/' ) {
    const tok = process.env.GITHUB_TOKEN || TOKEN || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ...state, tokenTail: tok ? tok.slice(-6) : '' }));
  }
  if (req.url === '/api/empire/sync') { syncOnce().then(() => { res.writeHead(200); res.end('synced'); }); return; }
  res.writeHead(404); res.end('not found');
}).listen(PORT, () => console.log('empire-sync on :' + PORT + ' owner=' + OWNER + ' repos=' + REPOS.join(',') + ' token=' + (TOKEN ? 'set' : 'MISSING')));

syncOnce();
setInterval(syncOnce, 5 * 60 * 1000);   // every 5 minutes

// autonomous agent loop — agents review repos + propose PRs every 30 min
setTimeout(() => { agents.runAll().catch(() => {}); }, 20000);
setInterval(() => { agents.runAll().catch(() => {}); }, 30 * 60 * 1000);
