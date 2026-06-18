'use client';
import { ModuleLayout } from '@/components/shell/ModuleLayout';
import { clientScene } from '@/components/three/SceneLoader';
const BrainScene = clientScene(() => import('@/modules/BrainScene'));
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { MetricTile } from '@/components/ui/MetricTile';
import { GlassCard } from '@/components/ui/GlassCard';
import { useEmpireData } from '@/data/useEmpireData';
import { useState } from 'react';

export default function BrainPage() {
  const { knowledge } = useEmpireData();
  const [q, setQ] = useState('');
  return (
    <ModuleLayout scene={<BrainScene />}>
      <ModuleHeader eyebrow="Intelligence Core" title="Knowledge Brain" status="Vector index synced" />
      <div className="flex items-start justify-end">
        <GlassCard className="pointer-events-auto w-full max-w-sm p-3" gold>
          <div className="text-[10px] uppercase tracking-[0.2em] text-empire-gold/70 mb-2">Semantic Search</div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Query the knowledge graph…"
            className="w-full bg-obsidian-900/70 border border-gold-500/20 rounded-lg px-3 py-2 text-sm text-white/90 outline-none focus:border-gold-500/50 placeholder:text-white/25" />
        </GlassCard>
      </div>
      <div className="pointer-events-auto grid grid-cols-3 gap-3 max-w-xl">
        <MetricTile label="Documents" value={knowledge.documents} accent="gold" />
        <MetricTile label="Entities" value={knowledge.entities} accent="cyan" />
        <MetricTile label="Relationships" value={knowledge.relationships} accent="success" />
      </div>
    </ModuleLayout>
  );
}
