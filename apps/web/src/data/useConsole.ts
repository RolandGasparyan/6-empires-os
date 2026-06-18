'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000/api/v1';
const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCK ?? 'true') === 'true';

export interface Overview {
  projects: { total: number; scaling: number; incubating: number; active: { name: string; progress: number }[] };
  tasks: { pipeline: Record<string, number>; total: number; recent: any[] };
  agents: { total: number; online: number; performance: { key: string; name: string; division: string; status: string; perf: number; throughput: number }[] };
  trading: { pnl_today: number; win_rate: number; active_trades: number; watchlist: { sym: string; px: number; chg: number }[] };
  revenue: { total_value: number; change_24h: number; series: number[] };
  research: { documents: number; entities: number; relationships: number; reports_today: number };
  deployments: { status: string; services: number; healthy: number; uptime_pct: number };
  system: { cpu: number; ram: number; disk: number; gateway_ms: number; health: number };
}

const MOCK: Overview = {
  projects: { total: 7, scaling: 3, incubating: 4, active: [
    { name: 'AI Trading System', progress: 78 }, { name: 'Quant Strategy Vault', progress: 63 }, { name: 'Risk Engine 2.0', progress: 81 }] },
  tasks: { pipeline: { queued: 2, active: 3, done: 41, failed: 0 }, total: 46, recent: [] },
  agents: { total: 6, online: 6, performance: [
    { key: 'strat', name: 'Chief Strategist', division: 'Strategy', status: 'ANALYZING', perf: 82, throughput: 142 },
    { key: 'data', name: 'Data Hunter', division: 'Research', status: 'RESEARCHING', perf: 76, throughput: 168 },
    { key: 'risk', name: 'Risk Guardian', division: 'Risk', status: 'MONITORING', perf: 74, throughput: 96 },
    { key: 'scout', name: 'Market Scout', division: 'Capital', status: 'TRADING', perf: 71, throughput: 311 },
    { key: 'news', name: 'News Analyst', division: 'Media', status: 'WRITING', perf: 69, throughput: 58 },
    { key: 'trend', name: 'Trend Tracker', division: 'Intelligence', status: 'THINKING', perf: 68, throughput: 71 }] },
  trading: { pnl_today: 12450, win_rate: 78.6, active_trades: 34, watchlist: [
    { sym: 'BTC/USDT', px: 62431.20, chg: 2.45 }, { sym: 'ETH/USDT', px: 3421.35, chg: 3.21 },
    { sym: 'GOLD', px: 2345.80, chg: 1.02 }, { sym: 'NASDAQ', px: 18738.53, chg: 1.25 }] },
  revenue: { total_value: 256780.45, change_24h: 8.24, series: Array.from({ length: 24 }, (_, i) => 230 + (i % 5) * 8 - 6 + i * 1.4) },
  research: { documents: 150, entities: 420, relationships: 1200, reports_today: 3 },
  deployments: { status: 'operational', services: 6, healthy: 6, uptime_pct: 99.4 },
  system: { cpu: 34, ram: 58, disk: 41, gateway_ms: 118, health: 98.5 },
};

export function useConsole() {
  const [data, setData] = useState<Overview>(MOCK);
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (USE_MOCK) return;
    let cancelled = false;
    const load = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('6empire_token') : null;
      axios.get(`${API}/console/overview`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
        .then(({ data }) => { if (!cancelled) { setData(data); setLive(true); } }).catch(() => {});
    };
    load();
    const t = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);
  return { data, live, source: USE_MOCK ? 'mock' : 'api' as const };
}
