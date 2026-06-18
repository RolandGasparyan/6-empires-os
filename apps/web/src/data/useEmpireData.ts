'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import type { DashboardStats, AgentsResponse, KnowledgeResponse } from '@/lib/types';
import { MOCK_STATS, MOCK_AGENTS_RAW, MOCK_KNOWLEDGE } from './mock';

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000/api/v1';
const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCK ?? 'true') === 'true';

/**
 * Single source of truth for dashboard data.
 * Mock by default; flip NEXT_PUBLIC_USE_MOCK=false to hit the live FastAPI
 * backend. The shape never changes — swapping data sources is one env var.
 */
export function useEmpireData() {
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [agents, setAgents] = useState<AgentsResponse>(MOCK_AGENTS_RAW);
  const [knowledge, setKnowledge] = useState<KnowledgeResponse>(MOCK_KNOWLEDGE);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (USE_MOCK) {
      // Gentle live-feel jitter so mock dashboards breathe.
      const t = setInterval(() => {
        setStats((s) => ({
          ...s,
          pnl: +(s.pnl + (Math.random() - 0.45) * 120).toFixed(2),
          health: +Math.min(100, Math.max(94, s.health + (Math.random() - 0.5))).toFixed(1),
          trades_today: s.trades_today + (Math.random() > 0.85 ? 1 : 0),
        }));
      }, 1800);
      return () => clearInterval(t);
    }
    let cancelled = false;
    const load = async () => {
      try {
        const [s, a, k] = await Promise.all([
          axios.get<DashboardStats>(`${API}/dashboard/stats`),
          axios.get<AgentsResponse>(`${API}/dashboard/agents`),
          axios.get<KnowledgeResponse>(`${API}/dashboard/knowledge`),
        ]);
        if (cancelled) return;
        setStats(s.data); setAgents(a.data); setKnowledge(k.data); setLive(true);
      } catch { /* keep last good / mock */ }
    };
    load();
    const t = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return { stats, agents, knowledge, live, source: USE_MOCK ? 'mock' : 'api' as const };
}
