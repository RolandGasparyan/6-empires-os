'use client';
import { useEffect, useRef, useState } from 'react';
import { HQAgent, AgentStatus } from './hqAgents';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/api/v1/ws/updates';
const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCK ?? 'true') === 'true';

export interface TwinEvent {
  kind: 'task' | 'memory' | 'status';
  agent: string;
  text: string;
  ts: number;
}

type Frame =
  | { type: 'snapshot'; agents: any[] }
  | { type: 'agent.status'; id: string; name?: string; status: string; load: number }
  | { type: 'task.active'; agent: string; title: string }
  | { type: 'task.done'; agent: string; title: string; result: string }
  | { type: 'memory.add'; agent: string; kind: string; content: string };

/**
 * Live digital-twin connection. Applies agent.status + snapshot frames to the
 * HQ agent array (via `apply`), and surfaces task and memory frames as a
 * rolling activity feed. Auto-reconnects; server re-sends a snapshot on connect.
 */
export function useTwin(apply: (fn: (prev: HQAgent[]) => HQAgent[]) => void) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<TwinEvent[]>([]);
  const ref = useRef<WebSocket | null>(null);
  const retry = useRef(0);

  useEffect(() => {
    if (USE_MOCK) return;
    let stopped = false;

    const pushEvent = (e: TwinEvent) => setEvents((prev) => [e, ...prev].slice(0, 12));

    const connect = () => {
      if (stopped) return;
      let ws: WebSocket;
      try { ws = new WebSocket(WS_URL); } catch { scheduleReconnect(); return; }
      ref.current = ws;
      ws.onopen = () => { setConnected(true); retry.current = 0; };
      ws.onmessage = (ev) => {
        let f: Frame;
        try { f = JSON.parse(ev.data); } catch { return; }
        switch (f.type) {
          case 'snapshot':
            apply((prev) => prev.map((a) => {
              const m = f.agents.find((x: any) => x.key === a.key || x.id === a.key);
              return m ? { ...a, status: up(m.status, a.status), perf: pct(m.load, a.perf) } : a;
            }));
            break;
          case 'agent.status':
            apply((prev) => prev.map((a) => a.key === f.id ? { ...a, status: up(f.status, a.status), perf: pct(f.load, a.perf) } : a));
            break;
          case 'task.active':
            pushEvent({ kind: 'task', agent: f.agent, text: `▸ working: ${f.title}`, ts: Date.now() });
            break;
          case 'task.done':
            pushEvent({ kind: 'task', agent: f.agent, text: `✓ done: ${f.title}`, ts: Date.now() });
            break;
          case 'memory.add':
            pushEvent({ kind: 'memory', agent: f.agent, text: `❖ ${f.content}`, ts: Date.now() });
            break;
        }
      };
      ws.onclose = () => { setConnected(false); scheduleReconnect(); };
      ws.onerror = () => { try { ws.close(); } catch {} };
    };
    const scheduleReconnect = () => {
      if (stopped) return;
      retry.current = Math.min(retry.current + 1, 6);
      setTimeout(connect, 1000 * retry.current);
    };
    connect();
    return () => { stopped = true; try { ref.current?.close(); } catch {} };
  }, [apply]);

  return { connected, events };
}

function up(s: string | undefined, fallback: AgentStatus): AgentStatus {
  return (s ? (String(s).toUpperCase() as AgentStatus) : fallback);
}
function pct(load: number | undefined, fallback: number): number {
  return load != null ? Math.round(load * 100) : fallback;
}
