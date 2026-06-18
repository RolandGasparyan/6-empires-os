'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { MODULES } from '@/lib/modules';
import { motion } from 'framer-motion';

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-[78px] hover:w-[248px] group transition-all duration-300 ease-out shrink-0 z-30
                      glass border-r border-gold-500/15 flex flex-col py-5 overflow-hidden">
      <div className="px-5 mb-8 flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-gold-liquid animate-gold-flow shadow-gold-glow flex items-center justify-center font-display font-extrabold text-obsidian-950 text-lg">6</div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          <div className="font-display font-bold text-sm text-gold-liquid leading-none">6-EMPIRE</div>
          <div className="text-[9px] tracking-[0.3em] text-white/35 mt-0.5">OS · v2.0</div>
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-1 px-3">
        {MODULES.map((m) => {
          const active = path === m.route;
          return (
            <Link key={m.slug} href={m.route}
              className={clsx('relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                active ? 'bg-gold-500/12 text-empire-gold' : 'text-white/55 hover:text-white hover:bg-white/5')}>
              {active && <motion.span layoutId="navGlow" className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r bg-gold-liquid shadow-gold-glow" />}
              <span className={clsx('text-lg shrink-0 w-6 text-center', active && 'drop-shadow-[0_0_8px_rgba(227,173,40,0.7)]')}>{m.glyph}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-sm font-medium">{m.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-5 pt-4 mt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-[10px] text-white/30 font-mono">FOUNDER · ROLAND</div>
      </div>
    </aside>
  );
}
