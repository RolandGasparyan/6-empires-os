'use client';
import { useEffect, useState } from 'react';
import { useEmpireData } from '@/data/useEmpireData';

export function TopBar() {
  const { stats, source } = useEmpireData();
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, []);
  return (
    <header className="h-14 shrink-0 glass border-b border-gold-500/15 flex items-center justify-between px-6 z-20">
      <div className="flex items-center gap-6">
        <div className="font-mono text-[11px] text-white/40">
          <span className="text-empire-gold">{clock}</span> · GMT
        </div>
        <div className="hidden md:flex items-center gap-2 text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-empire-success animate-pulse" />
          <span className="text-white/50 font-mono uppercase tracking-wider">
            {source === 'mock' ? 'SIMULATION FEED' : 'LIVE · FastAPI'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-5 font-mono text-[11px]">
        <span className="text-white/40">AGENTS <span className="text-empire-gold">{stats.agents_active}</span></span>
        <span className="text-white/40">HEALTH <span className="text-empire-success">{stats.health}%</span></span>
        <span className="text-white/40">P&amp;L <span className={stats.pnl >= 0 ? 'text-empire-success' : 'text-empire-danger'}>${stats.pnl.toLocaleString()}</span></span>
        <div className="h-7 w-7 rounded-full bg-gold-liquid animate-gold-flow shadow-gold-glow" />
      </div>
    </header>
  );
}
