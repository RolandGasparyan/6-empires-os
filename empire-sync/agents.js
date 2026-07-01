/**
 * 6-EMPIRE — Autonomous Agent Worker
 * For each repo, the owning EMPIRE-model agent reviews recent activity and
 * proposes ONE concrete, safe improvement. With a WRITE token it opens a Pull
 * Request (branch → file change → PR). Without it, it produces a dry-run
 * proposal (no writes). NEVER pushes to the default branch directly.
 *
 * Env (/opt/empire-sync/.env):
 *   GITHUB_TOKEN        read token (repo discovery + content)
 *   GITHUB_WRITE_TOKEN  optional write token (Contents+PR write) → enables real PRs
 *   GITHUB_OWNER        default RolandGasparyan
 *   EMPIRE_ROUTER       OpenAI-compatible router (default VPS :8000/v1)
 *   EMPIRE_KEY          router key
 */
const fs = require('fs');
const path = require('path');

const OWNER = process.env.GITHUB_OWNER || 'RolandGasparyan';
const ROUTER = process.env.EMPIRE_ROUTER || 'http://127.0.0.1:8000/v1';
const KEY = process.env.EMPIRE_KEY || 'sk-empire-local';
const STATE = path.join(__dirname, 'agents-state.json');

// repo → owning agent + EMPIRE model
// Scope trimmed 2026-07-01 audit: only these 2 repos are confirmed real, public
// GitHub repos under RolandGasparyan. The previous list (trading-guru-empire,
// strategy-lab-mac, dzayn-app, reincarnation-smm, REINCARNATION-Social-media-Gods,
// vortex) returned 404/"no access" for every run — they don't exist at this
// owner. Re-add here once Roland confirms where each one actually lives.
const ASSIGN = {
  '6-empires-os': { agent: 'Daniel Carter (CTO)',       model: 'empire-coder' },
  'founders-kit': { agent: 'Noah Parker (Automation Lead)', model: 'empire-coder' },
};

function ghGet(p, token) {
  return fetch('https://api.github.com' + p, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': '6e-agents', Authorization: 'Bearer ' + token },
  });
}
function ghJson(p, token) { return ghGet(p, token).then((r) => r.json().catch(() => null)); }

// ask an EMPIRE model for one improvement (returns {title, body, file, content})
async function propose(repo, agent, model, ctx) {
  const sys = `You are ${agent} of 6 EMPIRES. Review the repo "${repo}" and propose exactly ONE small, safe, high-value improvement (docs, README clarity, a config note, or a tiny non-breaking fix). Respond as STRICT JSON: {"title":"short PR title","body":"why + what","note":"one line for an AGENT_NOTES.md entry"}. No code fences.`;
  const user = `Repo context:\n${ctx}\n\nReturn only the JSON.`;
  try {
    const r = await fetch(ROUTER + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY },
      body: JSON.stringify({ model, stream: false, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }] }),
    });
    const j = await r.json();
    const txt = j.choices?.[0]?.message?.content || '';
    const m = txt.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : { title: 'Improve ' + repo, body: txt.slice(0, 400), note: txt.slice(0, 120) };
    return parsed;
  } catch (e) { return { title: 'Review ' + repo, body: 'agent busy: ' + e.message, note: 'pending review' }; }
}

// open a PR with a tiny AGENT_NOTES.md change (only when a write token exists)
async function openPR(repo, prop, writeTok) {
  const base = (await ghJson(`/repos/${OWNER}/${repo}`, writeTok))?.default_branch || 'main';
  const ref = (await ghJson(`/repos/${OWNER}/${repo}/git/ref/heads/${base}`, writeTok));
  const sha = ref?.object?.sha;
  if (!sha) throw new Error('no base sha');
  const branch = `empire-agent/${Date.now()}`;
  // create branch
  await fetch(`https://api.github.com/repos/${OWNER}/${repo}/git/refs`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + writeTok, 'User-Agent': '6e', 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });
  // read existing AGENT_NOTES.md (if any)
  const existing = await ghJson(`/repos/${OWNER}/${repo}/contents/AGENT_NOTES.md?ref=${branch}`, writeTok);
  const prev = existing?.content ? Buffer.from(existing.content, 'base64').toString('utf8') : '# 6-EMPIRE Agent Notes\n';
  const updated = prev + `\n- ${new Date().toISOString().slice(0, 10)} — ${prop.note}\n`;
  // commit file
  const put = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/contents/AGENT_NOTES.md`, {
    method: 'PUT', headers: { Authorization: 'Bearer ' + writeTok, 'User-Agent': '6e', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `chore(agent): ${prop.title}`, content: Buffer.from(updated).toString('base64'), branch, ...(existing?.sha ? { sha: existing.sha } : {}) }),
  });
  if (!put.ok) throw new Error('commit failed ' + put.status);
  // open PR
  const pr = await (await fetch(`https://api.github.com/repos/${OWNER}/${repo}/pulls`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + writeTok, 'User-Agent': '6e', 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: `🤖 ${prop.title}`, head: branch, base, body: prop.body + '\n\n— proposed autonomously by the 6-EMPIRE agent team. Review & merge at your discretion.' }),
  })).json();
  return pr.html_url || null;
}

async function runAll() {
  const readTok = process.env.GITHUB_TOKEN || '';
  const writeTok = process.env.GITHUB_WRITE_TOKEN || '';
  if (!readTok) return { ok: false, note: 'no read token' };
  const repos = Object.keys(ASSIGN);
  const out = [];
  for (const repo of repos) {
    const { agent, model } = ASSIGN[repo];
    try {
      const meta = await ghJson(`/repos/${OWNER}/${repo}`, readTok);
      if (!meta || meta.message) { out.push({ repo, agent, error: 'no access' }); continue; }
      const commits = await ghJson(`/repos/${OWNER}/${repo}/commits?per_page=3`, readTok);
      const readme = await ghJson(`/repos/${OWNER}/${repo}/readme`, readTok);
      const rd = readme?.content ? Buffer.from(readme.content, 'base64').toString('utf8').slice(0, 800) : '(no README)';
      const ctx = `desc: ${meta.description || '—'}\nlang: ${meta.language}\nrecent commits: ${(commits || []).map((c) => c.commit.message.split('\n')[0]).join(' | ')}\nREADME:\n${rd}`;
      const prop = await propose(repo, agent, model, ctx);
      let prUrl = null, mode = 'dry-run (no write token)';
      if (writeTok) { try { prUrl = await openPR(repo, prop, writeTok); mode = 'PR opened'; } catch (e) { mode = 'PR failed: ' + e.message; } }
      out.push({ repo, agent, model, title: prop.title, note: prop.note, prUrl, mode, at: new Date().toISOString() });
    } catch (e) { out.push({ repo, agent, error: String(e) }); }
  }
  const state = { ok: true, updated: new Date().toISOString(), writeEnabled: !!writeTok, agents: out };
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
  return state;
}

function readState() { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return { ok: false, agents: [] }; } }

module.exports = { runAll, readState };
