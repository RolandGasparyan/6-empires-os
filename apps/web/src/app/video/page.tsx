'use client';
import { ModuleLayout } from '@/components/shell/ModuleLayout';
import { clientScene } from '@/components/three/SceneLoader';
const VideoScene = clientScene(() => import('@/modules/VideoSceneDefault'));
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { GlassCard } from '@/components/ui/GlassCard';

const QUEUE = [
  { name: 'Q3 Brand Commercial', pct: 82, eta: '2m' },
  { name: 'Founder Avatar v4', pct: 47, eta: '6m' },
  { name: 'Social Reel — Capital', pct: 19, eta: '11m' },
];

export default function VideoPage() {
  return (
    <ModuleLayout scene={<VideoScene />}>
      <ModuleHeader eyebrow="Media Systems" title="Video Studio" status="3 renders in queue" />
      <div className="flex items-start justify-end">
        <GlassCard className="pointer-events-auto w-full max-w-sm p-4" gold>
          <div className="text-[10px] uppercase tracking-[0.2em] text-empire-gold/70 mb-3">Render Queue</div>
          <div className="space-y-3">
            {QUEUE.map((j) => (
              <div key={j.name}>
                <div className="flex justify-between text-xs text-white/70"><span>{j.name}</span><span className="font-mono text-white/40">{j.eta}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-gold-liquid animate-gold-flow" style={{ width: `${j.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
      <div className="pointer-events-auto flex gap-3">
        {['Text-to-Video', 'Avatar Gen', 'Image-to-Video', 'Pipeline'].map((c) => (
          <GlassCard key={c} className="px-4 py-2"><span className="text-xs font-medium text-white/70">{c}</span></GlassCard>
        ))}
      </div>
    </ModuleLayout>
  );
}
