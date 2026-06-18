'use client';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { HQ_AGENTS, HQAgent, AgentStatus } from './hqAgents';
import { useTwin } from './useTwin';

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000/api/v1';
const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCK ?? 'true') === 'true';

const STATUSES: AgentStatus[] = ['ANALYZING','RESEARCHING','MONITORING','TRADING','WRITING','THINKING'];

/**
 * Live HQ state.
 *  - Mock mode: status cycles locally so the floor feels alive offline.
 *  - Live mode: a one-time REST snapshot fills initial state, then the
 *    WebSocket digital twin (useTwin) pushes agent.status events in real time.
 */
export function useHQ() {
  const [agents, setAgents] = useState<HQAgent[]>(HQ_AGENTS);
  const apply = useCallback((fn: (prev: HQAgent[]) => HQAgent[]) => setAgents(fn), []);
  const { connected, events } = useTwin(apply);

  useEffect(() => {
    if (USE_MOCK) {
      const t = setInterval(() => {
        setAgents((prev) => prev.map((a) =>
          Math.random() > 0.78
            ? { ...a, status: STATUSES[(STATUSES.indexOf(a.status as AgentStatus) + 1) % STATUSES.length] }
            : a
        ));
      }, 2600);
      return () => clearInterval(t);
    }
    // Live mode: pull one REST snapshot so the scene is populated before the
    // socket's own snapshot arrives (and as a fallback if the socket is slow).
    let cancelled = false;
    axios.get(`${API}/agents`).then(({ data }) => {
      if (cancelled) return;
      const api: any[] = data.agents ?? data.active ?? [];
      setAgents((prev) => prev.map((a) => {
        const m = api.find((x) => x.key === a.key || x.id === a.key);
        return m ? { ...a, status: (String(m.status || a.status).toUpperCase() as AgentStatus), perf: m.load != null ? Math.round(m.load * 100) : a.perf } : a;
      }));
    }).catch(() => { /* keep designed defaults */ });
    return () => { cancelled = true; };
  }, []);

  return { agents, live: connected, events, source: USE_MOCK ? 'mock' : 'api' as const };
}
