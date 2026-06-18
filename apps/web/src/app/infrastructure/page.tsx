'use client';
import { ModuleLayout } from '@/components/shell/ModuleLayout';
import { clientScene } from '@/components/three/SceneLoader';
const InfraScene = clientScene(() => import('@/modules/InfraScene'));
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { MetricTile } from '@/components/ui/MetricTile';

export default function InfraPage() {
  return (
    <ModuleLayout scene={<InfraScene />}>
      <ModuleHeader eyebrow="Automation Infrastructure" title="Infrastructure Layer" status="Cluster healthy · 1 warning" />
      <div />
      <div className="pointer-events-auto grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
        <MetricTile label="Docker Nodes" value={8} accent="gold" />
        <MetricTile label="CPU" value="34" unit="%" accent="cyan" />
        <MetricTile label="API Gateway" value="118" unit="ms" accent="success" />
        <MetricTile label="DB Health" value="99.2" unit="%" accent="success" />
      </div>
    </ModuleLayout>
  );
}
