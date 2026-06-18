'use client';
import { ReactNode } from 'react';

export function ModuleLayout({ scene, children }: { scene: ReactNode; children: ReactNode }) {
  return (
    <div className="absolute inset-0 scanlines">
      <div className="absolute inset-0">{scene}</div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full w-full p-6 md:p-8 grid grid-rows-[auto_1fr_auto] gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}
