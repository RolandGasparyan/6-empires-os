'use client';
import { ModuleLayout } from '@/components/shell/ModuleLayout';
import { clientScene } from '@/components/three/SceneLoader';
const GlobeScene = clientScene(() => import('@/modules/GlobeScene'));
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { GLOBE_NODES } from '@/data/mock';

export default function GlobePage() {
  return (
    <ModuleLayout scene={<GlobeScene />}>
      <ModuleHeader eyebrow="Expansion Protocol" title="Global Operations" status={`${GLOBE_NODES.length} active regions`} />
      <div />
      <div className="pointer-events-auto flex gap-2 flex-wrap">
        {GLOBE_NODES.map((n) => (
          <GlassCard key={n.city} className="px-3 py-2">
            <div className="text-xs font-display font-semibold text-empire-gold">{n.city}</div>
            <div className="text-[10px] text-white/40 font-mono">load {(n.w * 100).toFixed(0)}%</div>
          </GlassCard>
        ))}
      </div>
    </ModuleLayout>
  );
}
