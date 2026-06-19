'use client';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

// Flagship reference dashboards render their OWN full-bleed chrome (top stat bar,
// left nav, right rail) to match the 6 EMPIRES master design. They must NOT be
// wrapped in the generic AppShell sidebar/topbar.
const FULL_BLEED = ['/', '/empire', '/office', '/world', '/executive', '/research'];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (FULL_BLEED.includes(pathname)) {
    return <div className="h-screen w-screen overflow-hidden" style={{ background: '#0a0a0b' }}>{children}</div>;
  }
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-obsidian-radial">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 relative overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
