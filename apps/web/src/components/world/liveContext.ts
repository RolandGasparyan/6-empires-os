'use client';
import { createContext, useContext } from 'react';

// Live agent status map (agent display name -> live status string), provided by
// EmpireWorld and read by each AgentWorker so it shows its real twin status.
export const LiveStatusCtx = createContext<Record<string, string>>({});

export function useLiveStatus(name: string, fallback: string): string {
  return useContext(LiveStatusCtx)[name] ?? fallback;
}
