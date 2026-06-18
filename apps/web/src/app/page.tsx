'use client';
import { ModuleLayout } from '@/components/shell/ModuleLayout';
import { clientScene } from '@/components/three/SceneLoader';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { MetricTile } from '@/components/ui/MetricTile';
import { useEmpireData } from '@/data/useEmpireData';

const CommandScene = clientScene(() => import('@/modules/CommandScene'));

export default function CommandPage() {
  const { stats, knowledge } = useEmpireData();
  return (
    <ModuleLayout scene={<CommandScene />}>
      <ModuleHeader eyebrow="Strategic Authority" title="Executive Command" status="All systems nominal" />
      <div />
      <div className="pointer-events-auto grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricTile label="Active Agents" value={stats.agents_active} accent="gold" />
        <MetricTile label="Trades Today" value={stats.trades_today} accent="cyan" delta={4.2} />
        <MetricTile label="Net P&L" value={`$${stats.pnl.toLocaleString()}`} accent={stats.pnl >= 0 ? 'success' : 'danger'} delta={2.8} />
        <MetricTile label="System Health" value={`${stats.health}`} unit="%" accent="success" />
        <MetricTile label="Knowledge Nodes" value={knowledge.entities} accent="gold" />
      </div>
    </ModuleLayout>
  );
}
