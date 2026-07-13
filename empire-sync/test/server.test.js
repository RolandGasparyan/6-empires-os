const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { spawn } = require('node:child_process');

const ADMIN_TOKEN = 'a'.repeat(48);
const WEBHOOK_SECRET = 'w'.repeat(48);
const ALLOWED_ORIGIN = 'https://admin.example.test';
let child;
let port;
let temporaryDirectory;
let environmentFile;

function request(route, { method = 'GET', headers = {}, body = '' } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: route,
      method,
      headers: { ...headers, ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}) },
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json;
        try { json = JSON.parse(text); } catch { json = null; }
        resolve({ status: res.statusCode, headers: res.headers, text, json });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function adminHeaders(extra = {}) {
  return { Authorization: `Bearer ${ADMIN_TOKEN}`, ...extra };
}

before(async () => {
  temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'empire-sync-test-'));
  environmentFile = path.join(temporaryDirectory, '.env');
  fs.writeFileSync(environmentFile, `SYNC_ADMIN_TOKEN=${ADMIN_TOKEN}\nGITHUB_WEBHOOK_SECRET=${WEBHOOK_SECRET}\n`, { mode: 0o600 });
  const serverPath = path.join(__dirname, '..', 'server.js');
  child = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      SYNC_ADMIN_TOKEN: ADMIN_TOKEN,
      GITHUB_WEBHOOK_SECRET: WEBHOOK_SECRET,
      SYNC_ALLOWED_ORIGINS: ALLOWED_ORIGIN,
      SYNC_DISABLE_JOBS: '1',
      SYNC_ENV_FILE: environmentFile,
      SYNC_STATE_FILE: path.join(temporaryDirectory, 'state.json'),
      SYNC_BRAIN_FILE: path.join(temporaryDirectory, 'brain.json'),
      AGENTS_STATE_FILE: path.join(temporaryDirectory, 'agents-state.json'),
      SYNC_LISTEN_HOST: '127.0.0.1',
      SYNC_MAX_BODY_BYTES: '1024',
      SYNC_PORT: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  port = await new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => reject(new Error(`server did not start: ${output}`)), 5_000);
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
      const match = output.match(/127\.0\.0\.1:(\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(Number(match[1]));
      }
    });
    child.stderr.on('data', (chunk) => { output += chunk.toString(); });
    child.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`server exited with ${code}: ${output}`));
    });
  });
});

after(() => {
  if (child) child.kill('SIGTERM');
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test('exposes only a minimal unauthenticated health response', async () => {
  const health = await request('/api/empire/health');
  assert.equal(health.status, 200);
  assert.deepEqual(health.json, { ok: true, service: 'empire-sync' });
  assert.equal((await request('/api/empire/setup')).status, 401);
});

test('protects state and brain with the admin bearer token', async () => {
  assert.equal((await request('/api/empire/state')).status, 401);
  assert.equal((await request('/api/empire/brain')).status, 401);

  const state = await request('/api/empire/state', { headers: adminHeaders() });
  assert.equal(state.status, 200);
  assert.equal(Object.hasOwn(state.json, 'tokenTail'), false);
  assert.equal(state.headers['cache-control'], 'no-store');
});

test('rejects disallowed browser origins and permits the configured origin', async () => {
  const denied = await request('/api/empire/state', {
    headers: adminHeaders({ Origin: 'https://evil.example' }),
  });
  assert.equal(denied.status, 403);

  const allowed = await request('/api/empire/state', {
    headers: adminHeaders({ Origin: ALLOWED_ORIGIN }),
  });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers['access-control-allow-origin'], ALLOWED_ORIGIN);
});

test('rejects shell metacharacters and atomically saves a valid Groq key', async () => {
  const malicious = JSON.stringify({ key: "gsk_validprefix';touch /tmp/empire-sync-pwned;#" });
  const rejected = await request('/api/empire/groq', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: malicious,
  });
  assert.equal(rejected.status, 400);
  assert.equal(fs.existsSync('/tmp/empire-sync-pwned'), false);

  const key = `gsk_${'z'.repeat(32)}`;
  const saved = await request('/api/empire/groq', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ key }),
  });
  assert.equal(saved.status, 200);
  assert.match(fs.readFileSync(environmentFile, 'utf8'), new RegExp(`^FREE_GROQ_KEY=${key}$`, 'm'));
  assert.equal(fs.statSync(environmentFile).mode & 0o777, 0o600);
});

test('requires a valid webhook signature', async () => {
  const body = JSON.stringify({ ref: 'refs/heads/main' });
  const invalid = await request('/api/empire/webhook', {
    method: 'POST',
    headers: { 'X-Hub-Signature-256': `sha256=${'0'.repeat(64)}` },
    body,
  });
  assert.equal(invalid.status, 401);

  const signature = `sha256=${crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')}`;
  const valid = await request('/api/empire/webhook', {
    method: 'POST',
    headers: { 'X-Hub-Signature-256': signature },
    body,
  });
  assert.equal(valid.status, 202);
});

test('enforces request size and strict methods', async () => {
  const oversized = await request('/api/empire/groq', {
    method: 'POST',
    headers: adminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ key: `gsk_${'x'.repeat(2048)}` }),
  });
  assert.equal(oversized.status, 413);
  assert.equal((await request('/api/empire/sync', { headers: adminHeaders() })).status, 405);
});

test('refuses to start without a strong administrator secret', async () => {
  const env = { ...process.env };
  delete env.SYNC_ADMIN_TOKEN;
  env.SYNC_ENV_FILE = path.join(temporaryDirectory, 'missing.env');
  env.SYNC_DISABLE_JOBS = '1';
  env.SYNC_PORT = '0';
  const serverPath = path.join(__dirname, '..', 'server.js');
  const result = await new Promise((resolve) => {
    const processUnderTest = spawn(process.execPath, [serverPath], {
      env,
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let error = '';
    processUnderTest.stderr.on('data', (chunk) => { error += chunk.toString(); });
    processUnderTest.on('exit', (code) => resolve({ code, error }));
  });
  assert.equal(result.code, 1);
  assert.match(result.error, /SYNC_ADMIN_TOKEN must be configured/);
});
