import type { DashboardStats, AgentsResponse, KnowledgeResponse, EmpireAgent } from '@/lib/types';

export const MOCK_STATS: DashboardStats = { agents_active: 9, trades_today: 12, pnl: 2500.0, health: 98.5 };

export const MOCK_AGENTS_RAW: AgentsResponse = {
  total: 7,
  active: [{ name: 'TITAN', status: 'executing' }],
};

export const MOCK_KNOWLEDGE: KnowledgeResponse = { documents: 150, entities: 420, relationships: 1200 };

// The 7 divisions of 6-EMPIRE, mapped to control-room agents.
export const EMPIRE_AGENTS: EmpireAgent[] = [
  { id: 'ceo',   name: 'TITAN',   role: 'CEO',          status: 'executing', load: 0.62, throughput: 184 },
  { id: 'intel', name: 'ORACLE',  role: 'Intelligence', status: 'thinking',  load: 0.81, throughput: 142 },
  { id: 'cap',   name: 'MIDAS',   role: 'Capital',      status: 'executing', load: 0.74, throughput: 96  },
  { id: 'auto',  name: 'FORGE',   role: 'Automation',   status: 'executing', load: 0.55, throughput: 311 },
  { id: 'vent',  name: 'GENESIS', role: 'Venture',      status: 'idle',      load: 0.18, throughput: 22  },
  { id: 'media', name: 'AURA',    role: 'Media',        status: 'executing', load: 0.69, throughput: 58  },
  { id: 'exp',   name: 'VANGUARD',role: 'Expansion',    status: 'thinking',  load: 0.43, throughput: 71  },
];

// Live operations nodes for the globe (lat, lng, weight).
export const GLOBE_NODES = [
  { city: 'New York',  lat: 40.71,  lng: -74.0,  w: 1.0 },
  { city: 'London',    lat: 51.50,  lng: -0.12,  w: 0.9 },
  { city: 'Dubai',     lat: 25.20,  lng: 55.27,  w: 0.8 },
  { city: 'Singapore', lat: 1.35,   lng: 103.82, w: 0.85 },
  { city: 'Tokyo',     lat: 35.68,  lng: 139.69, w: 0.75 },
  { city: 'Zurich',    lat: 47.37,  lng: 8.54,   w: 0.6 },
  { city: 'São Paulo', lat: -23.55, lng: -46.63, w: 0.5 },
  { city: 'Sydney',    lat: -33.87, lng: 151.21, w: 0.45 },
];
