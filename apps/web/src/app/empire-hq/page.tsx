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

// map each agent to one of the EMPIRE models on the chat backend
const AGENT_MODEL: Record<string, string> = {
  ceo: 'empire-prime', strat: 'empire-strategist', analyst: 'empire-trading',
  cto: 'empire-coder', ai: 'empire-coder', data: 'empire-research',
  mkt: 'empire-media', risk: 'empire-trading',
};

export default function EmpireHQPage() {
  const [entered, setEntered] = useState(false);
  const [sel, setSel] = useState<TeamMember | null>(null);
  const [ask, setAsk] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const audio = useRef(createExecAudio());
  useEffect(() => () => audio.current.stop(), []);
  function enter() { audio.current.start(); setEntered(true); }

  // reset the conversation when switching agents
  useEffect(() => { setReply(''); setAsk(''); }, [sel?.id]);

  async function askAgent() {
    if (!sel || !ask.trim() || busy) return;
    const q = ask.trim(); setAsk(''); setBusy(true); setReply('');
    const model = AGENT_MODEL[sel.id] || 'empire-prime';
    const sys = `You are ${sel.name}, the ${sel.title} of 6 EMPIRES. ${sel.blurb} Answer in character, sharp and brief.`;
    try {
      const res = await fetch('/chat/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, mode: 'empire', messages: [{ role: 'system', content: sys }, { role: 'user', content: q }] }) });
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let acc = '';
      while (true) { const { done, value } = await reader.read(); if (done) break; acc += dec.decode(value, { stream: true }); setReply(acc); }
    } catch (e: any) { setReply('⚠️ ' + (e?.message || 'error')); }
    setBusy(false);
  }

  return (
    <div className="absolute inset-0" style={{ background: '#1fb8d8' }}>
      <div className="absolute inset-0"><Scene onAgent={(m: TeamMember) => setSel(m)} /></div>

      <div className="absolute top-4 left-5 flex items-center gap-3 pointer-events-none">
        <img src={`${BP}/empire-logo.png`} width={46} height={46} alt="6 Empires" style={{ objectFit: 'contain' }} />
        <div className="leading-none">
          <div className="font-serif tracking-[0.24em] text-[17px]" style={{ color: GOLD }}>6 EMPIRES</div>
          <div className="text-[9px] tracking-[0.3em] text-[#d4af37]/55 mt-1">CORPORATION · LIVE HQ</div>
        </div>
      </div>
      <div className="absolute top-5 right-5 font-mono text-[10px] text-white/40 pointer-events-none text-right">
        click a room to enter · click an agent for profile<br />drag to orbit · scroll to zoom · click empty space to pull back
      </div>

      {/* team roster strip */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 max-h-[70vh] overflow-auto pr-1 space-y-1">
        {TEAM.map((m) => (
          <button key={m.id} onClick={() => setSel(m)}
            className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] w-[190px] text-left transition-all duration-200 ease-out hover:translate-x-1 hover:scale-[1.03]"
            style={{ background: sel?.id === m.id ? `${m.color}22` : '#0c0c0e99', border: `1px solid ${sel?.id === m.id ? m.color : '#ffffff10'}`, boxShadow: sel?.id === m.id ? `0 0 18px -6px ${m.color}` : 'none' }}
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

      {/* agent profile card */}
      {sel && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2 w-[280px] rounded-2xl overflow-hidden backdrop-blur"
          style={{ background: '#0a0a0cee', border: `1px solid ${sel.color}88`, boxShadow: `0 0 60px -14px ${sel.color}` }}>
          <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${sel.color}, #0a0a0c)` }}>
            <button onClick={() => setSel(null)} className="absolute top-2 right-3 text-white/70">✕</button>
            <div className="absolute -bottom-7 left-5 w-14 h-14 rounded-full grid place-items-center" style={{ background: '#0a0a0c', border: `2px solid ${sel.color}` }}>
              <div className="w-9 h-9 rounded-full" style={{ background: sel.color, boxShadow: `0 0 14px ${sel.color}` }} />
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
        <div className="absolute inset-0 grid place-items-center backdrop-blur-sm" style={{ background: '#060708e6' }}>
          <div className="text-center">
            <img src={`${BP}/empire-logo.png`} width={200} height={200} alt="6 Empire" className="mx-auto" style={{ objectFit: 'contain' }} />
            <div className="mt-1 font-serif tracking-[0.28em] text-[12px] text-white/60">CORPORATION · LIVING HQ</div>
            <button onClick={enter} className="mt-5 px-10 py-4 rounded-xl font-serif tracking-[0.2em] text-[15px] font-semibold"
              style={{ background: 'linear-gradient(135deg,#f4d98b,#c8941a)', color: '#0a0a0b', boxShadow: `0 0 50px -8px ${GOLD}` }}>
              ENTER THE EMPIRE
            </button>
            <div className="mt-3 text-[10px] tracking-[0.25em] text-white/35">12 AGENTS · CONNECTED ROOMS · LIVE 3D</div>
          </div>
        </div>
      )}
    </div>
  );
}
