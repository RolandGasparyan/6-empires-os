'use client';
import { FounderGate } from '@/founder/FounderGate';

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return <FounderGate>{children}</FounderGate>;
}
