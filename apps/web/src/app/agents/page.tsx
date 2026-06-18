'use client';
import { ModuleLayout } from '@/components/shell/ModuleLayout';
import { clientScene } from '@/components/three/SceneLoader';
const AgentsScene = clientScene(() => import('@/modules/AgentsScene'));
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { EMPIRE_AGENTS } from '@/data/mock';

const dot: Record<string, string> = { executing: 'bg-empire-success', thinking: 'bg-empire-cyan', idle: 'bg-empire-gold', offline: 'bg-empire-danger' };

export default function AgentsPage() {
  return (
    <ModuleLayout scene={<AgentsScene />}>
      <ModuleHeader eyebrow="Intelligence Core" title="Agent Control Room" status={`${EMPIRE_AGENTS.filter(a=>a.status!=='offline').length} agents online`} />
      <div />
      <div className="pointer-events-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {EMPIRE_AGENTS.map((a) => (
          <GlassCard key={a.id} className="px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-empire-gold">{a.name}</span>
              <span className={`h-2 w-2 rounded-full ${dot[a.status]} animate-pulse`} />
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{a.role}</div>
            <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gold-liquid animate-gold-flow" style={{ width: `${a.load * 100}%` }} />
            </div>
            <div className="text-[10px] text-white/35 mt-1 font-mono">{a.throughput} t/min</div>
          </GlassCard>
        ))}
      </div>
    </ModuleLayout>
  );
}
