'use client';
/**
 * /world — the living 6 EMPIRES corporation as a navigable isometric world.
 * The building is the product; the overlay (logo + dept rail + room panel)
 * is the secondary interface that opens FROM the rooms.
 */
import { useState } from 'react';
import { clientScene } from '@/components/three/SceneLoader';
import type { Dept } from '@/components/world/EmpireWorld';

const World = clientScene(() => import('@/components/world/EmpireWorld'));
const GOLD = '#d4af37';

const DEPT_LIST: [string, string][] = [
  ['throne', 'Boss Throne'], ['agents', 'Agent Floor'], ['trading', 'Trading Floor'],
  ['research', 'Research'], ['devlab', 'Developer Lab'], ['media', 'Media Studio'],
  ['board', 'Board Room'], ['ops', 'Operations'],
];

export default function WorldPage() {
  const [active, setActive] = useState<Dept | null>(null);

  return (
    <div className="absolute inset-0" style={{ background: '#080809' }}>
      <div className="absolute inset-0"><World onEnter={(d: Dept) => setActive(d)} /></div>

      {/* top-left brand */}
      <div className="absolute top-4 left-5 flex items-center gap-3 pointer-events-none">
        <img src="/empire-mark.svg" width={40} height={40} alt="6 Empires" />
        <div className="leading-none">
          <div className="font-serif tracking-[0.24em] text-[18px]" style={{ color: GOLD }}>6 EMPIRES</div>
          <div className="text-[9px] tracking-[0.34em] text-[#d4af37]/55 mt-1">LIVING AI CORPORATION</div>
        </div>
      </div>

      {/* top-right hint */}
      <div className="absolute top-4 right-5 text-right pointer-events-none">
        <div className="font-mono text-[10px] text-white/45">click a department to enter</div>
        <div className="font-mono text-[9px] text-white/30 mt-0.5">drag · scroll · click empty space to pull back</div>
      </div>

      {/* department rail */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 space-y-1.5">
        {DEPT_LIST.map(([id, name]) => (
          <div key={id}
            className={`px-3 py-2 rounded-lg text-[12px] cursor-default border transition-colors ${active?.id === id ? 'text-[#0a0a0b]' : 'text-white/55 border-transparent'}`}
            style={active?.id === id ? { background: 'linear-gradient(135deg,#e3c668,#c8941a)', borderColor: GOLD, fontWeight: 600 } : { background: '#0c0c0e99', borderColor: `${GOLD}22` }}>
            {name}
          </div>
        ))}
      </div>

      {/* room panel — opens FROM the room you entered */}
      {active && (
        <div className="absolute right-5 bottom-5 w-[300px] rounded-2xl p-4 backdrop-blur"
          style={{ background: '#0c0c0ecc', border: `1px solid ${active.accent}55`, boxShadow: `0 0 40px -10px ${active.accent}55` }}>
          <div className="flex items-center justify-between">
            <div className="font-serif tracking-[0.16em] text-[16px]" style={{ color: active.accent }}>{active.label}</div>
            <button onClick={() => setActive(null)} className="text-white/40 text-sm">✕</button>
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">{active.agents.length} agent{active.agents.length !== 1 ? 's' : ''} working</div>
          <div className="mt-3 space-y-2">
            {active.agents.length === 0 && <div className="text-[11px] text-white/40">Executive meeting space — board convenes here.</div>}
            {active.agents.map((a) => (
              <div key={a.name} className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: a.color, boxShadow: `0 0 8px ${a.color}` }} />
                <span className="text-[12px] text-white/85 flex-1">{a.name}</span>
                <span className="font-mono text-[9px] tracking-wider" style={{ color: a.color }}>{a.status}</span>
              </div>
            ))}
          </div>
          <a href={active.id === 'trading' ? '/empire' : '/console'}
            className="block text-center mt-4 py-2 rounded-lg text-[12px] font-semibold"
            style={{ background: 'linear-gradient(135deg,#e3c668,#c8941a)', color: '#0a0a0b' }}>
            OPEN {active.id === 'trading' ? 'TRADING' : 'DEPARTMENT'} DASHBOARD →
          </a>
        </div>
      )}

      {/* footer motto */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-serif tracking-[0.3em] text-[11px] pointer-events-none" style={{ color: `${GOLD}aa` }}>
        WE BUILD · WE TRADE · WE OWN
      </div>
    </div>
  );
}
