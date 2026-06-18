'use client';
import { motion } from 'framer-motion';

export function ModuleHeader({ eyebrow, title, status }: { eyebrow: string; title: string; status?: string; }) {
  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
      <div className="text-[11px] uppercase tracking-[0.32em] text-empire-gold/70 font-mono">{eyebrow}</div>
      <h1 className="font-display font-extrabold text-3xl md:text-4xl mt-1 text-gold-liquid leading-none">{title}</h1>
      {status && (
        <div className="flex items-center gap-2 mt-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-empire-success/60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-empire-success" />
          </span>
          <span className="text-[11px] text-white/50 font-mono uppercase tracking-wider">{status}</span>
        </div>
      )}
    </motion.div>
  );
}
