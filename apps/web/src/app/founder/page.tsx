'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { FOUNDER_MODULES } from '@/founder/modules';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricTile } from '@/components/ui/MetricTile';

export default function FounderHome() {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<any>(null);
  useEffect(() => { api.get('/system/health').then((r) => setHealth(r.data)).catch(() => {}); }, []);

  return (
    <div className="absolute inset-0 overflow-auto bg-obsidian-radial scanlines p-6 md:p-10">
      <div className="flex items-start justify-between">
        <ModuleHeader eyebrow="Private · Founder Only" title="Command Center" status={`Signed in · ${user?.email ?? ''}`} />
        <button onClick={logout} className="glass rounded-lg px-3 py-1.5 text-xs text-white/60 hover:text-white">Sign out</button>
      </div>

      {health && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 max-w-3xl">
          <MetricTile label="CPU" value={health.resources.cpu} unit="%" accent="cyan" />
          <MetricTile label="RAM" value={health.resources.ram} unit="%" accent="gold" />
          <MetricTile label="Disk" value={health.resources.disk} unit="%" accent="gold" />
          <MetricTile label="Gateway" value={health.resources.gateway_ms} unit="ms" accent="success" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {FOUNDER_MODULES.map((m) => (
          <Link key={m.slug} href={`/founder/${m.slug}`}>
            <GlassCard className="p-5 h-full hover:glass-gold transition-all cursor-pointer group">
              <div className="text-2xl text-empire-gold drop-shadow-[0_0_8px_rgba(227,173,40,0.5)]">{m.glyph}</div>
              <div className="font-display font-bold text-base text-white mt-3 group-hover:text-gold-liquid">{m.name}</div>
              <p className="text-white/45 text-xs mt-1 leading-relaxed">{m.desc}</p>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
