'use client';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

function Loader() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-obsidian-radial">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-2 border-gold-500/30 border-t-gold-400 animate-spin" />
        <div className="text-[11px] tracking-[0.3em] text-empire-gold/60 font-mono uppercase">Initializing 3D Core</div>
      </div>
    </div>
  );
}

export function clientScene<P extends object>(loader: () => Promise<{ default: ComponentType<P> }>) {
  return dynamic(loader, { ssr: false, loading: () => <Loader /> });
}
