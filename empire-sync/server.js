/**
 * 6-EMPIRE GitHub sync service.
 *
 * The public surface is intentionally tiny: health and a signed GitHub webhook.
 * Every state or mutation endpoint requires the administrator bearer token and
 * is expected to be blocked from the public internet by the deployment proxy.
 */
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

const APP_DIR = __dirname;
const ENV_FILE = process.env.SYNC_ENV_FILE || path.join(APP_DIR, '.env');

function loadEnvironment() {
  let contents;
  try {
    contents = fs.readFileSync(ENV_FILE, 'utf8');
  } catch {
    return;
  }
  for (const line of contents.split('\n')) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

loadEnvironment();

const ADMIN_TOKEN = process.env.SYNC_ADMIN_TOKEN || '';
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';
const OWNER = process.env.GITHUB_OWNER || 'RolandGasparyan';
const PORT = Number(process.env.SYNC_PORT || 8120);
const LISTEN_HOST = process.env.SYNC_LISTEN_HOST || '127.0.0.1';
const MAX_BODY_BYTES = Number(process.env.SYNC_MAX_BODY_BYTES || 16 * 1024);
const REQUEST_TIMEOUT_MS = Number(process.env.SYNC_REQUEST_TIMEOUT_MS || 10_000);
const STATE_FILE = process.env.SYNC_STATE_FILE || path.join(APP_DIR, 'state.json');
const BRAIN_FILE = process.env.SYNC_BRAIN_FILE || path.join(APP_DIR, 'brain.json');
const REPOS = (process.env.SYNC_REPOS || '6-empires-os,trading-guru-empire,strategy-lab-mac,dzayn-app,reincarnation-smm,REINCARNATION-Social-media-Gods,vortex,BOOKING-AI-AGENT,founders-kit')
  .split(',').map((value) => value.trim()).filter(Boolean);
const ALLOWED_ORIGINS = new Set((process.env.SYNC_ALLOWED_ORIGINS || '')
  .split(',').map((value) => value.trim()).filter(Boolean));

if (ADMIN_TOKEN.length < 32 || /replace/i.test(ADMIN_TOKEN)) {
  throw new Error('SYNC_ADMIN_TOKEN must be configured with at least 32 random characters');
}
if (!Number.isSafeInteger(PORT) || PORT < 0 || PORT > 65535) {
  throw new Error('SYNC_PORT must be a valid TCP port');
}
if (!Number.isSafeInteger(MAX_BODY_BYTES) || MAX_BODY_BYTES < 1024) {
  throw new Error('SYNC_MAX_BODY_BYTES must be at least 1024');
}

const agents = require('./agents');
let state = { ok: false, updated: null, owner: OWNER, repos: [], note: 'awaiting first sync' };
try {
  state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
} catch {}

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function fixedTimeEqual(left, right) {
  const leftHash = crypto.createHash('sha256').update(String(left)).digest();
  const rightHash = crypto.createHash('sha256').update(String(right)).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function bearerToken(req) {
  const match = String(req.headers.authorization || '').match(/^Bearer ([^\s]+)$/);
  return match ? match[1] : '';
}

function requireAdmin(req) {
  if (!fixedTimeEqual(bearerToken(req), ADMIN_TOKEN)) {
    throw new HttpError(401, 'unauthorized');
  }
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;
  if (!ALLOWED_ORIGINS.has(origin)) throw new HttpError(403, 'origin not allowed');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Hub-Signature-256');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Vary', 'Origin');
}

function json(res, statusCode, value) {
  const body = JSON.stringify(value);
  res.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      req.setTimeout(0);
      callback(value);
    };

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.pause();
      finish(reject, new HttpError(408, 'request timed out'));
    });
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.pause();
        finish(reject, new HttpError(413, 'request too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => finish(resolve, Buffer.concat(chunks)));
    req.on('error', () => finish(reject, new HttpError(400, 'invalid request')));
  });
}

async function readJson(req) {
  const raw = await readBody(req);
  let value;
  try {
    value = JSON.parse(raw.toString('utf8'));
  } catch {
    throw new HttpError(400, 'invalid JSON');
  }
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new HttpError(400, 'JSON object required');
  }
  return value;
}

function atomicWrite(file, contents) {
  const directory = path.dirname(file);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const temporary = path.join(directory, `.${path.basename(file)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  try {
    fs.writeFileSync(temporary, contents, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    fs.renameSync(temporary, file);
    fs.chmodSync(file, 0o600);
  } finally {
    try { fs.unlinkSync(temporary); } catch {}
  }
}

function updateEnvironment(updates) {
  for (const [key, value] of Object.entries(updates)) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(key) || /[\r\n\0]/.test(value)) {
      throw new HttpError(400, 'invalid environment value');
    }
  }
  let current = '';
  try { current = fs.readFileSync(ENV_FILE, 'utf8'); } catch {}
  const remaining = new Map(Object.entries(updates));
  const lines = current.split('\n').filter((line) => line !== '').map((line) => {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=/);
    if (!match || !remaining.has(match[1])) return line;
    const value = remaining.get(match[1]);
    remaining.delete(match[1]);
    return `${match[1]}=${value}`;
  });
  for (const [key, value] of remaining) lines.push(`${key}=${value}`);
  atomicWrite(ENV_FILE, `${lines.join('\n')}\n`);
  for (const [key, value] of Object.entries(updates)) process.env[key] = value;
}

function writeState(nextState) {
  state = nextState;
  atomicWrite(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

function github(pathname) {
  const token = process.env.GITHUB_TOKEN || '';
  return fetch(`https://api.github.com${pathname}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': '6-empire-sync',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  }).then(async (response) => ({
    status: response.status,
    body: await response.json().catch(() => null),
  }));
}

function stageFor(repo) {
  const days = repo.lastPushDays;
  if (days == null) return { stage: 'IDEA', prog: 0.15 };
  if (days < 2) return { stage: 'LIVE', prog: 0.82 };
  if (days < 7) return { stage: 'BUILDING', prog: 0.6 };
  if (days < 30) return { stage: 'BETA', prog: 0.45 };
  return { stage: 'PAUSED', prog: 0.3 };
}

async function syncOnce() {
  if (!process.env.GITHUB_TOKEN) {
    writeState({ ...state, ok: false, updated: new Date().toISOString(), note: 'no GITHUB_TOKEN set' });
    return state;
  }
  let repoNames = REPOS.slice();
  try {
    const discovered = await github('/user/repos?per_page=100&affiliation=owner,collaborator&sort=pushed');
    if (Array.isArray(discovered.body) && discovered.body.length) {
      const available = discovered.body.map((repo) => repo.name);
      repoNames = [...new Set([
        ...REPOS.filter((name) => available.includes(name)),
        ...available.filter((name) => !REPOS.includes(name)),
      ])].slice(0, 12);
    }
  } catch {}

  const repos = [];
  for (const name of repoNames) {
    try {
      const { status, body } = await github(`/repos/${OWNER}/${name}`);
      if (status !== 200 || !body) {
        repos.push({ name, error: `status ${status}` });
        continue;
      }
      const pushedAt = body.pushed_at ? new Date(body.pushed_at) : null;
      const lastPushDays = pushedAt ? Math.floor((Date.now() - pushedAt.getTime()) / 86_400_000) : null;
      const commits = await github(`/repos/${OWNER}/${name}/commits?per_page=1`);
      const lastCommit = Array.isArray(commits.body) && commits.body[0]
        ? { msg: commits.body[0].commit.message.split('\n')[0], date: commits.body[0].commit.author.date }
        : null;
      const repo = {
        name,
        url: body.html_url,
        desc: body.description || '',
        stars: body.stargazers_count,
        openIssues: body.open_issues_count,
        language: body.language,
        lastPush: body.pushed_at,
        lastPushDays,
        lastCommit,
      };
      repos.push({ ...repo, ...stageFor(repo) });
    } catch {
      repos.push({ name, error: 'sync failed' });
    }
  }
  writeState({ ok: true, updated: new Date().toISOString(), owner: OWNER, repos });
  return state;
}

function readBrain() {
  try {
    return JSON.parse(fs.readFileSync(BRAIN_FILE, 'utf8'));
  } catch {
    return { source: 'EMPIRE-Vault', noteCount: 0, notes: [] };
  }
}

function verifyWebhook(raw, signature) {
  if (WEBHOOK_SECRET.length < 32 || /replace/i.test(WEBHOOK_SECRET)) return false;
  if (!/^sha256=[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = `sha256=${crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex')}`;
  return fixedTimeEqual(signature.toLowerCase(), expected.toLowerCase());
}

async function handle(req, res) {
  applyCors(req, res);
  const url = new URL(req.url, 'http://localhost');
  const route = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method === 'GET' && (route === '/' || route === '/api/empire/health')) {
    json(res, 200, { ok: true, service: 'empire-sync' });
    return;
  }
  if (req.method === 'POST' && route === '/api/empire/webhook') {
    const raw = await readBody(req);
    if (!verifyWebhook(raw, String(req.headers['x-hub-signature-256'] || ''))) {
      throw new HttpError(401, 'invalid webhook signature');
    }
    await syncOnce();
    json(res, 202, { ok: true });
    return;
  }

  const protectedRoutes = new Set([
    '/api/empire/state',
    '/api/empire/brain',
    '/api/empire/setup',
    '/api/empire/groq',
    '/api/empire/writetoken',
    '/api/empire/agents/state',
    '/api/empire/agents/run',
    '/api/empire/sync',
  ]);
  if (protectedRoutes.has(route)) requireAdmin(req);

  if (req.method === 'GET' && route === '/api/empire/state') {
    json(res, 200, state);
    return;
  }
  if (req.method === 'GET' && route === '/api/empire/brain') {
    json(res, 200, readBrain());
    return;
  }
  if (req.method === 'GET' && route === '/api/empire/agents/state') {
    json(res, 200, agents.readState());
    return;
  }
  if (req.method === 'POST' && route === '/api/empire/setup') {
    const { token } = await readJson(req);
    if (!/^github_pat_[A-Za-z0-9_]{20,}$/.test(token || '') && !/^ghp_[A-Za-z0-9]{20,}$/.test(token || '')) {
      throw new HttpError(400, 'invalid GitHub token format');
    }
    updateEnvironment({ GITHUB_TOKEN: token });
    await syncOnce();
    json(res, 200, { ok: true, synced: state.repos.filter((repo) => !repo.error).length });
    return;
  }
  if (req.method === 'POST' && route === '/api/empire/groq') {
    const { key } = await readJson(req);
    if (!/^gsk_[A-Za-z0-9_-]{20,}$/.test(key || '')) throw new HttpError(400, 'invalid Groq key format');
    updateEnvironment({ FREE_GROQ_KEY: key });
    json(res, 200, { ok: true });
    return;
  }
  if (req.method === 'POST' && route === '/api/empire/writetoken') {
    const { token } = await readJson(req);
    if (!/^github_pat_[A-Za-z0-9_]{20,}$/.test(token || '') && !/^ghp_[A-Za-z0-9]{20,}$/.test(token || '')) {
      throw new HttpError(400, 'invalid GitHub token format');
    }
    updateEnvironment({ GITHUB_WRITE_TOKEN: token });
    json(res, 200, { ok: true });
    return;
  }
  if (req.method === 'POST' && route === '/api/empire/agents/run') {
    json(res, 200, await agents.runAll());
    return;
  }
  if (req.method === 'POST' && route === '/api/empire/sync') {
    await syncOnce();
    json(res, 200, { ok: true, updated: state.updated });
    return;
  }
  if (protectedRoutes.has(route)) throw new HttpError(405, 'method not allowed');
  throw new HttpError(404, 'not found');
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    const message = error instanceof HttpError ? error.message : 'internal error';
    json(res, statusCode, { ok: false, error: message });
  });
});
server.requestTimeout = REQUEST_TIMEOUT_MS;
server.headersTimeout = Math.min(REQUEST_TIMEOUT_MS, 5_000);
server.keepAliveTimeout = 5_000;

server.listen(PORT, LISTEN_HOST, () => {
  const address = server.address();
  const boundPort = typeof address === 'object' && address ? address.port : PORT;
  console.log(`empire-sync listening on ${LISTEN_HOST}:${boundPort}`);
});

if (process.env.SYNC_DISABLE_JOBS !== '1') {
  syncOnce().catch(() => {});
  setInterval(() => syncOnce().catch(() => {}), 5 * 60 * 1000).unref();
  setTimeout(() => agents.runAll().catch(() => {}), 20_000).unref();
  setInterval(() => agents.runAll().catch(() => {}), 30 * 60 * 1000).unref();
}

module.exports = { server };
