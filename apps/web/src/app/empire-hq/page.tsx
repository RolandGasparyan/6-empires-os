'use client';
/**
 * /empire-hq — the CONNECTED 6 EMPIRES CORPORATION.
 * All departments on one campus, physically connected by corridors, all 12
 * named agents at home, several walking between rooms. Click agent → profile;
 * click room → fly in. Enter-gate + spatial audio.
 */
import { useEffect, useRef, useState } from 'react';
import { clientScene } from '@/components/three/SceneLoader';
import { createExecAudio } from '@/components/executive/useExecAudio';
import { TEAM, type TeamMember } from '@/components/executive/team';

const Scene = clientScene(() => import('@/components/executive/ConnectedWorld'));
const GOLD = '#d4af37';
// basePath-aware asset prefix (so /empire-mark.svg resolves under /world on the VPS)
const BP = process.env.NEXT_PUBLIC_BASE_PATH || '';

// every agent → one of the real EMPIRE models on the chat backend
const AGENT_MODEL: Record<string, string> = {
  ceo:   'empire-prime',       // founder / strategic authority
  coo:   'empire-strategist',  // operations
  cto:   'empire-coder',       // engineering
  cfo:   'empire-trading',     // finance
  strat: 'empire-strategist',  // chief strategist
  analyst:'empire-trading',    // market analyst
  ai:    'empire-coder',       // AI engineer
  data:  'empire-research',    // data scientist
  risk:  'empire-trading',     // risk
  auto:  'empire-coder',       // automation
  mkt:   'empire-media',       // marketing / artist
  ops:   'empire-strategist',  // operations manager
  music: 'empire-media',       // music AI producer (Suno-connected)
  video: 'empire-media',       // video & reels AI
};
const modelFor = (id: string) => AGENT_MODEL[id] || 'empire-prime';

// per-agent academic-level expertise injected into the system prompt
const AGENT_SKILLS: Record<string, string> = {
  ceo:   'PhD-level strategy, capital allocation, systems thinking, leadership; speaks like a visionary founder.',
  coo:   'expert operations, process design, org scaling, OKRs and execution systems.',
  cto:   'principal-engineer level: architecture, distributed systems, security, Python/Next.js/Postgres/Redis/Qdrant/Neo4j.',
  cfo:   'CFA-level corporate finance, modeling, unit economics, fundraising, risk-adjusted returns.',
  strat: 'McKinsey-grade strategy, game theory, market entry, competitive moats.',
  analyst:'quant market analysis, technical + on-chain + macro, statistics and probability.',
  ai:    'ML/LLM engineering: training, RAG, embeddings, agent orchestration, evaluation.',
  data:  'data science: statistics, ML, experimentation, causal inference, visualization.',
  risk:  'risk management: VaR, position sizing, hedging, drawdown control, compliance.',
  auto:  'automation & DevOps: CI/CD, pipelines, infra-as-code, no-code/low-code orchestration.',
  mkt:   'growth marketing, brand, positioning, viral content, paid + organic funnels.',
  ops:   'operations management: logistics, throughput, efficiency, SLAs.',
  music: 'AI music production with Suno: prompt-craft, song structure, mixing, sound design.',
  video: 'AI video & reels: text-to-video, editing, hooks, retention, short-form virality.',
};

// mini Simpsons-yellow face for the profile card (matches the 3D rig look)
function AgentFace({ m }: { m: TeamMember }) {
  const hair = m.hair || '#1a1410';
  return (
    <svg viewBox="0 0 64 64" width="60" height="60" style={{ display: 'block' }}>
      {/* head */}
      <circle cx="32" cy="34" r="20" fill="#f5c518" />
      {/* hair sweep */}
      <path d="M12 28 Q32 6 52 28 Q44 18 32 18 Q20 18 12 28 Z" fill={hair} />
      {m.beard && <path d="M16 38 Q32 60 48 38 Q44 50 32 50 Q20 50 16 38 Z" fill={hair} />}
      {/* eyes */}
      <circle cx="25" cy="32" r="6" fill="#fff" /><circle cx="39" cy="32" r="6" fill="#fff" />
      <circle cx="25" cy="33" r="2.4" fill="#0a0a0a" /><circle cx="39" cy="33" r="2.4" fill="#0a0a0a" />
      {m.glasses && <g stroke="#0a0a0a" strokeWidth="1.4" fill="none"><circle cx="25" cy="32" r="7.5" /><circle cx="39" cy="32" r="7.5" /><line x1="32" y1="32" x2="32" y2="32" /></g>}
      {/* nose */}
      <circle cx="32" cy="38" r="2.6" fill="#d9a800" />
      {/* collar / suit */}
      <path d="M16 54 Q32 46 48 54 L48 60 L16 60 Z" fill={m.color === '#1a1a1a' ? '#222' : m.color} />
      {m.bowtie
        ? <path d="M28 50 L32 53 L28 56 Z M36 50 L32 53 L36 56 Z" fill="#0a0a0a" />
        : <rect x="30.5" y="50" width="3" height="9" fill={m.color === '#1a1a1a' ? '#444' : m.color} />}
    </svg>
  );
}

export default function EmpireHQPage() {
  const [entered, setEntered] = useState(false);
  const [sel, setSel] = useState<TeamMember | null>(null);
  const [ask, setAsk] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [navOpen, setNavOpen] = useState(false);   // team roster drawer (closed by default)
  const [projects, setProjects] = useState<any[]>([]);   // live GitHub repos
  const [agentWork, setAgentWork] = useState<any[]>([]); // autonomous agent actions
  const [mounted, setMounted] = useState(false);         // client-only gate (R3F can't SSR)
  const audio = useRef(createExecAudio());

  // Render nothing until mounted so SSR HTML === first client render (no hydration mismatch)
  useEffect(() => { setMounted(true); }, []);

  // pull live GitHub project + autonomous-agent state every minute (real data)
  useEffect(() => {
    let alive = true;
    const pull = () => {
      fetch('/api/empire/state').then((r) => r.json()).then((d) => {
        if (alive && d?.ok && Array.isArray(d.repos)) setProjects(d.repos.filter((r: any) => !r.error));
      }).catch(() => {});
      fetch('/api/empire/agents/state').then((r) => r.json()).then((d) => {
        if (alive && Array.isArray(d?.agents)) setAgentWork(d.agents.filter((a: any) => !a.error));
      }).catch(() => {});
    };
    pull(); const id = setInterval(pull, 60000); return () => { alive = false; clearInterval(id); };
  }, []);

  // map a repo to the agent who owns it (real assignment)
  const REPO_OWNER: Record<string, string> = {
    '6-empires-os': 'Daniel Carter (CTO)', 'trading-guru-empire': 'Emma Sullivan (Analyst)',
    'strategy-lab-mac': 'Marcus Hayes (Strategist)', 'dzayn-app': 'Mia Coleman (Marketing)',
    'reincarnation-smm': 'Mia Coleman (Marketing)', 'REINCARNATION-Social-media-Gods': 'Zoe Hart (Video AI)',
    'vortex': 'Ethan Brooks (AI Engineer)',
  };
  useEffect(() => () => audio.current.stop(), []);
  function enter() { audio.current.start(); setEntered(true); }

  // reset the conversation when switching agents
  useEffect(() => { setReply(''); setAsk(''); }, [sel?.id]);

  async function askAgent() {
    if (!sel || !ask.trim() || busy) return;
    const q = ask.trim(); setAsk(''); setBusy(true); setReply('');
    const model = modelFor(sel.id);
    const skills = AGENT_SKILLS[sel.id] || 'elite, academic-level expertise in your domain.';
    // inject the live GitHub project context so agents reason on REAL state
    const ownedName = Object.keys(REPO_OWNER).find((k) => REPO_OWNER[k].toLowerCase().includes(sel.name.split(' ')[0].toLowerCase()));
    const mine = projects.find((p: any) => p.name === ownedName);
    const projCtx = projects.length
      ? `\nLIVE PROJECTS (real GitHub): ${projects.map((p: any) => `${p.name}=${p.stage}(${p.lastPushDays === 0 ? 'today' : p.lastPushDays + 'd'})`).join(', ')}.` +
        (mine ? ` You personally own ${mine.name} (${mine.stage}); last commit: "${mine.lastCommit?.msg || 'n/a'}".` : '')
      : '';
    const sys = `You are ${sel.name}, the ${sel.title} of 6 EMPIRES — Roland Gasparyan's AI-native corporation. Expertise: ${skills} ${sel.blurb}${projCtx} Answer in character, sharp, expert-level and actionable. Use the real project data above.`;
    try {
      const res = await fetch('/chat/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, mode: 'empire', messages: [{ role: 'system', content: sys }, { role: 'user', content: q }] }) });
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let acc = '';
      while (true) { const { done, value } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); setReply(acc); }
    } catch (e: any) { setReply('⚠️ ' + (e?.message || 'error')); }
    setBusy(false);
  }

  // client-only gate: SSR and first client paint render an identical static shell,
  // eliminating React hydration errors (#418/#423/#425) from the R3F Canvas + live data.
  if (!mounted) return <div className="absolute inset-0" style={{ background: '#050608' }} />;

  return (
    <div className="absolute inset-0" style={{ background: '#1fb8d8' }}>
      <div className="absolute inset-0"><Scene onAgent={(m: TeamMember) => { audio.current.click(); setSel(m); }} /></div>

      <div className="absolute top-5 right-5 font-mono text-[10px] text-white/40 pointer-events-none text-right hidden md:block">
        click a room to enter · click an agent for profile<br />drag to orbit · scroll to zoom · click empty space to pull back
      </div>

      {/* TEAM navigation drawer — toggled open/closed so it never blocks the view */}
      <button onClick={() => setNavOpen((o) => !o)}
        className="absolute top-20 left-5 z-30 px-3 py-2 rounded-lg text-[12px] font-semibold backdrop-blur transition"
        style={{ background: '#0c0c0ecc', border: `1px solid ${GOLD}55`, color: GOLD }}>
        {navOpen ? '✕ TEAM' : '☰ TEAM'}
      </button>
      <div className={`absolute left-5 top-32 max-h-[64vh] overflow-auto pr-1 space-y-1 z-30 transition-all duration-300 ${navOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
        {TEAM.map((m) => (
          <button key={m.id} onClick={() => { audio.current.click(); setSel(m); }}
            className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] w-[180px] text-left transition-all duration-200 ease-out hover:translate-x-1 hover:scale-[1.03]"
            style={{ background: sel?.id === m.id ? `${m.color}22` : '#0c0c0edd', border: `1px solid ${sel?.id === m.id ? m.color : '#ffffff10'}`, boxShadow: sel?.id === m.id ? `0 0 18px -6px ${m.color}` : 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 18px -4px ${m.color}`; e.currentTarget.style.borderColor = `${m.color}aa`; }}
            onMouseLeave={(e) => { if (sel?.id !== m.id) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#ffffff10'; } }}>
            <span className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125" style={{ background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
            <span className="text-white/85 truncate flex-1">{m.name}</span>
            <span className="text-[8px] text-white/35 truncate">{m.title.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {entered && (
        <button onClick={() => audio.current.setVolume(audio.current.on ? 0 : 0.5)}
          className="absolute bottom-5 left-5 px-3 py-2 rounded-lg text-[11px] backdrop-blur"
          style={{ background: '#0c0c0ecc', border: `1px solid ${GOLD}44`, color: GOLD }}>♪ ambience</button>
      )}

      {/* agent profile card — side card on desktop, bottom sheet on phones */}
      {sel && (
        <div className="absolute z-20 backdrop-blur overflow-hidden
                        left-3 right-3 bottom-3 rounded-2xl
                        sm:left-auto sm:right-5 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:w-[280px]
                        max-h-[80vh] overflow-y-auto"
          style={{ background: '#0a0a0cee', border: `1px solid ${sel.color}88`, boxShadow: `0 0 60px -14px ${sel.color}` }}>
          <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${sel.color}, #0a0a0c)` }}>
            <button onClick={() => setSel(null)} className="absolute top-2 right-3 text-white/70">✕</button>
            <div className="absolute -bottom-7 left-5 w-16 h-16 rounded-full grid place-items-center overflow-hidden" style={{ background: '#0a0a0c', border: `2px solid ${sel.color}` }}>
              <AgentFace m={sel} />
            </div>
            <div className="absolute top-3 left-5 text-[9px] tracking-[0.3em] text-black/60">👑 6 EMPIRES</div>
          </div>
          <div className="px-5 pt-9 pb-5">
            <div className="font-serif text-[18px] text-white leading-tight">{sel.name}</div>
            <div className="font-mono text-[11px] tracking-[0.15em] mt-0.5" style={{ color: sel.color }}>{sel.title}</div>
            <div className="mt-3 text-[12px] text-white/70 italic">{sel.tagline}</div>
            <div className="text-[12px] text-white/45 mt-0.5">{sel.blurb}</div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] tracking-[0.2em] text-white/40">STATUS</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: sel.color }}><span className="w-2 h-2 rounded-full animate-pulse" style={{ background: sel.color }} />{sel.status}</span>
            </div>

            {/* AUTONOMOUS WORK — this agent's latest real action on their repo */}
            {(() => {
              const first = sel.name.split(' ')[0].toLowerCase();
              const mine = agentWork.filter((a: any) => (a.agent || '').toLowerCase().includes(first));
              if (!mine.length) return null;
              return (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] tracking-[0.2em] text-white/40">🤖 AUTONOMOUS WORK</span>
                    <span className="text-[9px] font-mono" style={{ color: sel.color }}>real-time</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-auto pr-1">
                    {mine.map((a: any, i: number) => (
                      <div key={i} className="rounded-lg p-2" style={{ background: '#ffffff06', border: '1px solid #ffffff10' }}>
                        <div className="text-[11px] text-white/90 truncate">{a.title}</div>
                        <div className="mt-0.5 text-[9px] text-white/40">{a.repo} · {a.prUrl ? 'PR opened' : a.mode}</div>
                        {a.prUrl && <a href={a.prUrl} target="_blank" rel="noreferrer" className="text-[10px]" style={{ color: sel.color }}>↗ view Pull Request</a>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* CEO → LIVE PROJECTS panel (real GitHub data, who pulls what, real-time) */}
            {sel.id === 'ceo' && (
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] tracking-[0.2em] text-white/40">LIVE PROJECTS</span>
                  <span className="text-[9px] font-mono" style={{ color: GOLD }}>{projects.length} repos · GitHub</span>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-auto pr-1">
                  {projects.length === 0 && <div className="text-[11px] text-white/35">syncing GitHub…</div>}
                  {projects.map((p: any) => {
                    const work = agentWork.find((a: any) => a.repo === p.name);
                    const c = p.stage === 'LIVE' ? '#34f5a0' : p.stage === 'BETA' ? '#6fb3ff' : p.stage === 'BUILDING' ? '#ffd21e' : p.stage === 'PAUSED' ? '#ff9bbf' : '#9fdce6';
                    return (
                      <a key={p.name} href={p.url} target="_blank" rel="noreferrer"
                        className="block rounded-lg p-2 transition hover:translate-x-0.5"
                        style={{ background: '#ffffff06', border: '1px solid #ffffff10' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/90 font-medium truncate">{p.name}</span>
                          <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded" style={{ color: c, border: `1px solid ${c}55` }}>{p.stage}</span>
                        </div>
                        <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: '#ffffff10' }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.round((p.prog || 0) * 100)}%`, background: c }} />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[8.5px] text-white/40">
                          <span className="truncate">{REPO_OWNER[p.name] || 'Unassigned'}</span>
                          <span>{p.language || '—'} · {p.lastPushDays === 0 ? 'today' : p.lastPushDays + 'd'}</span>
                        </div>
                        {p.lastCommit?.msg && <div className="mt-0.5 text-[8.5px] text-white/30 truncate">↳ {p.lastCommit.msg}</div>}
                        {work?.title && <div className="mt-0.5 text-[8.5px] truncate" style={{ color: GOLD }}>🤖 {work.prUrl ? 'PR' : 'proposal'}: {work.title}</div>}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ask this agent — talks to the live EMPIRE model */}
            <div className="mt-4">
              {reply && (
                <div className="mb-2 max-h-40 overflow-auto text-[12px] leading-relaxed text-white/85 rounded-lg p-2.5"
                  style={{ background: '#ffffff08', border: `1px solid ${sel.color}33` }}>{reply}{busy && <span className="opacity-50"> ▍</span>}</div>
              )}
              <div className="flex items-center gap-2">
                <input value={ask} onChange={(e) => setAsk(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') askAgent(); }}
                  placeholder={`Ask ${sel.name.split(' ')[0]}…`} disabled={busy}
                  className="flex-1 bg-transparent text-[12px] text-white/90 px-3 py-2 rounded-lg outline-none"
                  style={{ border: `1px solid ${sel.color}44` }} />
                <button onClick={askAgent} disabled={busy}
                  className="px-3 py-2 rounded-lg text-[12px] font-semibold"
                  style={{ background: `linear-gradient(135deg, ${sel.color}, #0a0a0c)`, color: '#fff', opacity: busy ? 0.5 : 1 }}>
                  {busy ? '…' : '→'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!entered && (
        <div className="absolute inset-0 grid place-items-center" style={{ background: '#1fb8d8' }}>
          {/* Simpsons-style toon font (yellow), no gold/black, no logo */}
          <style>{`
            @font-face{font-family:'ToonGate';src:url('https://cdn.jsdelivr.net/fontsource/fonts/luckiest-guy@latest/latin-400-normal.woff2') format('woff2');font-display:swap;}
            .toon{font-family:'ToonGate','Luckiest Guy',system-ui,sans-serif;}
            .toon-stroke{ -webkit-text-stroke:3px #1a1a1a; paint-order:stroke fill; }
            @keyframes gatePop{0%{transform:scale(.96)}50%{transform:scale(1.03)}100%{transform:scale(.96)}}
          `}</style>
          <div className="text-center px-6">
            <div className="toon toon-stroke" style={{ color: '#ffd21e', fontSize: 'clamp(48px,11vw,128px)', lineHeight: 0.95, letterSpacing: '0.02em', textShadow: '0 8px 0 #e88', }}>
              6 EMPIRES
            </div>
            <div className="toon mt-4" style={{ color: '#fff', WebkitTextStroke: '1.5px #1a1a1a', fontSize: 'clamp(16px,3vw,26px)', letterSpacing: '0.08em' }}>
              LIVING CORPORATION
            </div>
            <button onClick={enter} className="toon toon-stroke mt-9 px-12 py-5 rounded-[22px]"
              style={{ color: '#1a1a1a', WebkitTextStroke: '0', background: '#ffd21e', fontSize: 'clamp(22px,4vw,34px)', letterSpacing: '0.04em', border: '4px solid #1a1a1a', boxShadow: '0 8px 0 #d49b00', cursor: 'pointer' }}>
              ENTER EMPIRE
            </button>
            <div className="toon mt-6" style={{ color: '#fff', WebkitTextStroke: '1px #1a1a1a', fontSize: 'clamp(12px,2vw,16px)', letterSpacing: '0.12em' }}>
              12 AGENTS · CONNECTED ROOMS · LIVE 3D
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
