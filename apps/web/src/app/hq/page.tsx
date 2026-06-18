'use client';
import { useState, useMemo } from 'react';
import axios from 'axios';
import { clientScene } from '@/components/three/SceneLoader';
import { useHQ } from '@/data/useHQ';
import { STATUS_COLOR } from '@/data/hqAgents';
import type { CamTarget } from '@/components/hq/CameraRig';

const HQScene = clientScene(() => import('@/components/hq/HQScene'));
const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000/api/v1';

const VIEWS: Record<string, { cam: CamTarget; area: string }> = {
  boss:  { cam: { tgt: [-8, 1.6, -3.5], R: 9, theta: 0, phi: 1.05 }, area: 'BOSS COMMAND CENTER' },
  floor: { cam: { tgt: [6, 1.2, 5], R: 11, theta: 0.5, phi: 1.0 }, area: 'AGENT FLOOR · 6 OFFICES' },
};

export default function HQPage() {
  const { agents, source, live, events } = useHQ();
  const [selected, setSelected] = useState(-1);
  const [view, setView] = useState<'boss' | 'floor'>('boss');
  const [autoSpin, setAutoSpin] = useState(false);
  const [camTarget, setCamTarget] = useState<CamTarget | null>(VIEWS.boss.cam);
  const [cmd, setCmd] = useState('');
  const [sending, setSending] = useState(false);

  async function sendCommand() {
    if (!cmd.trim() || selected < 0) return;
    setSending(true);
    try {
      // Note: requires a founder bearer token in production; wired via auth store.
      const token = typeof window !== 'undefined' ? localStorage.getItem('6empire_token') : null;
      await axios.post(`${API}/agents/${agents[selected].key}/command`, { title: cmd },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      setCmd('');
    } catch { /* surfaced via the live feed when it lands */ }
    finally { setSending(false); }
  }

  const area = useMemo(() => {
    if (selected >= 0) return `${agents[selected].name.toUpperCase()} · ${agents[selected].role}`;
    return VIEWS[view].area;
  }, [selected, view, agents]);

  function goView(v: 'boss' | 'floor') {
    setView(v); setSelected(-1); setCamTarget({ ...VIEWS[v].cam });
  }
  function enter(i: number) {
    setSelected(i);
    const a = agents[i];
    setCamTarget({ tgt: [a.pos[0], 1.2, a.pos[2] + 0.3], R: 3.6, theta: 0, phi: 1.18 });
  }

  const sel = selected >= 0 ? agents[selected] : null;
  const statusCol = sel ? STATUS_COLOR[sel.status] : '#e6c878';

  return (
    <div className="absolute inset-0 bg-obsidian-radial overflow-hidden">
      <div className="absolute inset-0">
        <HQScene agents={agents} selected={selected} onSelect={enter} camTarget={camTarget} autoSpin={autoSpin} />
      </div>

      {/* top-left brand + area */}
      <div className="absolute top-3 left-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg border border-gold-500/55 grid place-items-center text-empire-gold text-sm">∞</div>
          <div>
            <div className="text-sm tracking-[0.26em] text-empire-gold font-display">6 EMPIRES</div>
            <div className="font-mono text-[9px] tracking-[0.3em] text-white/45 mt-0.5">{area}</div>
          </div>
        </div>
      </div>

      {/* top-right live status */}
      <div className="absolute top-3 right-4 text-right font-mono text-[10px] text-white/55 pointer-events-none">
        <div><span className="inline-block w-1.5 h-1.5 rounded-full bg-empire-success mr-1.5" />{agents.length} AGENTS · {source === 'mock' ? 'SIM' : live ? 'LIVE · TWIN' : 'CONNECTING'}</div>
        <div className="mt-0.5 text-white/40">drag · scroll · click agent</div>
      </div>

      {/* live activity feed (task/memory events) */}
      {events && events.length > 0 && (
        <div className="absolute top-16 right-4 w-[260px] glass rounded-xl p-3 pointer-events-none">
          <div className="font-mono text-[9px] tracking-[0.2em] text-empire-gold/70 mb-2">AGENT ACTIVITY · LIVE</div>
          <div className="space-y-1.5">
            {events.slice(0, 6).map((e, i) => (
              <div key={e.ts + '' + i} className="text-[10px] leading-snug border-l-2 pl-2" style={{ borderColor: e.kind === 'memory' ? '#a78bfa' : '#34f5a0' }}>
                <span className="font-mono text-white/35">{e.agent}</span>{' '}
                <span className="text-white/70">{e.text.length > 64 ? e.text.slice(0, 64) + '…' : e.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute left-4 bottom-4 w-[250px] glass glass-gold rounded-2xl p-4">
        <div className="font-mono text-[10px] tracking-[0.16em]" style={{ color: sel ? sel.color : '#e6c878' }}>
          {sel ? sel.role : 'EMPIRE BOSS'}
        </div>
        <div className="text-base font-display font-semibold text-white mt-0.5">{sel ? sel.name : 'Command Center'}</div>
        <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed">
          {sel ? sel.body : 'You sit at the throne desk. All six agents and all departments update live. Click any agent to enter their office.'}
        </p>
        <div className="mt-2 font-mono text-[10px]">
          {sel ? (
            <span className="text-white/45">STATUS <span style={{ color: statusCol }}>{sel.status}</span> · PERF <span className="text-empire-gold">{sel.perf}%</span></span>
          ) : (
            <span className="text-white/45">REVENUE <span className="text-empire-success">$256K</span> · HEALTH <span className="text-empire-gold">98.5%</span></span>
          )}
        </div>

        {sel && (
          <div className="mt-3 flex gap-1.5">
            <input
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendCommand()}
              placeholder={`Command ${sel.name}…`}
              className="flex-1 bg-obsidian-900/70 border border-gold-500/25 rounded-lg px-2.5 py-1.5 text-[11px] text-white/90 outline-none focus:border-gold-500/50 placeholder:text-white/25"
            />
            <button onClick={sendCommand} disabled={sending || !cmd.trim()}
              className="bg-gold-liquid animate-gold-flow text-obsidian-950 font-semibold text-[11px] px-2.5 rounded-lg disabled:opacity-40">
              {sending ? '…' : 'Send'}
            </button>
          </div>
        )}
      </div>

      {/* view controls */}
      <div className="absolute right-4 bottom-4 flex flex-col gap-1.5 items-end">
        <button onClick={() => goView('boss')} className={`font-mono text-[10px] px-3 py-1.5 rounded-lg border min-w-[120px] text-center ${view === 'boss' && selected < 0 ? 'bg-gold-500/20 border-gold-500/50 text-empire-gold' : 'bg-gold-500/8 border-gold-500/30 text-empire-gold'}`}>BOSS CENTER</button>
        <button onClick={() => goView('floor')} className={`font-mono text-[10px] px-3 py-1.5 rounded-lg border min-w-[120px] text-center ${view === 'floor' && selected < 0 ? 'bg-gold-500/20 border-gold-500/50 text-empire-gold' : 'bg-gold-500/8 border-gold-500/30 text-empire-gold'}`}>AGENT FLOOR</button>
        <button onClick={() => setAutoSpin((s) => !s)} className={`font-mono text-[10px] px-3 py-1.5 rounded-lg border min-w-[120px] text-center ${autoSpin ? 'bg-gold-500/20 border-gold-500/50' : 'bg-gold-500/8 border-gold-500/30'} text-empire-gold`}>↻ orbit</button>
      </div>
    </div>
  );
}
