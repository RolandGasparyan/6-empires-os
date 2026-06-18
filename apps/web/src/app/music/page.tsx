'use client';
import { ModuleLayout } from '@/components/shell/ModuleLayout';
import { clientScene } from '@/components/three/SceneLoader';
const MusicScene = clientScene(() => import('@/modules/MusicSceneDefault'));
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { GlassCard } from '@/components/ui/GlassCard';

export default function MusicPage() {
  return (
    <ModuleLayout scene={<MusicScene />}>
      <ModuleHeader eyebrow="Media Systems" title="Music Studio" status="AI Composer ready" />
      <div className="flex items-start justify-end">
        <GlassCard className="pointer-events-auto w-full max-w-sm p-4" gold>
          <div className="text-[10px] uppercase tracking-[0.2em] text-empire-gold/70 mb-3">AI Composer</div>
          <textarea placeholder="Describe the track… (genre, mood, BPM)"
            className="w-full h-20 bg-obsidian-900/70 border border-gold-500/20 rounded-lg px-3 py-2 text-sm text-white/90 outline-none focus:border-gold-500/50 resize-none placeholder:text-white/25" />
          <button className="mt-3 w-full bg-gold-liquid animate-gold-flow text-obsidian-950 font-semibold text-sm py-2 rounded-lg shadow-gold-glow hover:brightness-110 transition">Generate Composition</button>
        </GlassCard>
      </div>
      <div className="pointer-events-auto flex gap-3">
        {['Compose', 'Sound Design', 'Voice Clone', 'Master'].map((c) => (
          <GlassCard key={c} className="px-4 py-2"><span className="text-xs font-medium text-white/70">{c}</span></GlassCard>
        ))}
      </div>
    </ModuleLayout>
  );
}
