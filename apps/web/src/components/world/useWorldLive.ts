'use client';
/**
 * Live agent status for the 3D world. Subscribes to the same WebSocket twin the
 * dashboards use and returns a { agentName -> status } map so each AgentWorker
 * shows its REAL state (ANALYZING / TRADING / MONITORING …) streamed from the
 * backend engine. Falls back to the static status when no live frame yet.
 */
import { useEffect, useRef, useState } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/api/v1/ws/updates';
const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCK ?? 'true') === 'true';

// backend agent key -> world agent display name
const KEY_TO_NAME: Record<string, string> = {
  strat: 'Chief Strategist',
  data: 'Data Hunter',
  risk: 'Risk Guardian',
  scout: 'Market Scout',
  news: 'News Analyst',
  trend: 'Trend Tracker',
};

export function useWorldLive() {
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [connected, setConnected] = useState(false);
  const ref = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (USE_MOCK) return;
    let stopped = false;
    let retry = 0;
    const apply = (key: string, status: string) => {
      const name = KEY_TO_NAME[key];
      if (name && status) setStatuses((p) => ({ ...p, [name]: String(status).toUpperCase() }));
    };
    const connect = () => {
      if (stopped) return;
      let ws: WebSocket;
      try { ws = new WebSocket(WS_URL); } catch { setTimeout(connect, 1500); return; }
      ref.current = ws;
      ws.onopen = () => { setConnected(true); retry = 0; };
      ws.onmessage = (ev) => {
        let f: any; try { f = JSON.parse(ev.data); } catch { return; }
        if (f.type === 'snapshot' && Array.isArray(f.agents)) f.agents.forEach((a: any) => apply(a.key ?? a.id, a.status));
        else if (f.type === 'agent.status') apply(f.id, f.status);
      };
      ws.onclose = () => { setConnected(false); if (!stopped) { retry = Math.min(retry + 1, 6); setTimeout(connect, 1000 * retry); } };
      ws.onerror = () => { try { ws.close(); } catch {} };
    };
    connect();
    return () => { stopped = true; try { ref.current?.close(); } catch {} };
  }, []);

  return { statuses, connected };
}
