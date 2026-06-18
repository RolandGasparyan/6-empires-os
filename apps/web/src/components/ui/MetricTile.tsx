'use client';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export function MetricTile({ label, value, unit, delta, accent = 'gold' }: {
  label: string; value: string | number; unit?: string; delta?: number;
  accent?: 'gold' | 'cyan' | 'success' | 'danger';
}) {
  const accentClass = {
    gold: 'text-empire-gold', cyan: 'text-empire-cyan',
    success: 'text-empire-success', danger: 'text-empire-danger',
  }[accent];
  return (
    <div className="glass rounded-xl px-4 py-3 relative">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-medium">{label}</div>
      <div className="flex items-baseline gap-1.5 mt-1">
        <motion.span key={String(value)} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}
          className={clsx('font-display font-bold text-2xl tabular-nums', accentClass)}>
          {value}
        </motion.span>
        {unit && <span className="text-xs text-white/40">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className={clsx('text-[11px] mt-0.5 tabular-nums', delta >= 0 ? 'text-empire-success' : 'text-empire-danger')}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
