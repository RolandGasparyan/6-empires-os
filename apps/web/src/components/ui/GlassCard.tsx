'use client';
import { ReactNode } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export function GlassCard({ children, className, gold, glow }: { children: ReactNode; className?: string; gold?: boolean; glow?: boolean; }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={clsx('glass rounded-2xl relative overflow-hidden', gold && 'glass-gold', glow && 'shadow-gold-glow', className)}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
      {children}
    </motion.div>
  );
}
