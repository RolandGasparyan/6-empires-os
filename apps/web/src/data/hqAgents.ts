// HQ agent model — the six division agents shown in the 3D headquarters.
// Themed-office metadata drives each agent's room; status drives the live ring.
export type AgentStatus =
  | 'ANALYZING' | 'RESEARCHING' | 'MONITORING' | 'TRADING' | 'WRITING' | 'THINKING' | 'IDLE';

export interface HQAgent {
  key: string;
  name: string;
  role: string;        // themed office name, e.g. "WAR ROOM"
  division: string;
  color: string;       // hex string for Three.js
  status: AgentStatus;
  body: string;        // office description
  perf: number;        // 0..100
  pos: [number, number, number];
}

export const STATUS_COLOR: Record<AgentStatus, string> = {
  ANALYZING: '#3fe0ff', RESEARCHING: '#34f5a0', MONITORING: '#ff5d8f',
  TRADING: '#e3ad28', WRITING: '#a78bfa', THINKING: '#f0997b', IDLE: '#888780',
};

// Designed defaults — overridden by live API/WS data when available.
export const HQ_AGENTS: HQAgent[] = [
  { key: 'strat', name: 'Chief Strategist', role: 'WAR ROOM',       division: 'Strategy',     color: '#3fe0ff', status: 'ANALYZING',   perf: 82, body: 'War room with strategy screens, planning tables and live analytics walls.', pos: [3, 0, 3] },
  { key: 'data',  name: 'Data Hunter',      role: 'INTELLIGENCE',   division: 'Research',     color: '#34f5a0', status: 'RESEARCHING', perf: 76, body: 'Intelligence center — research monitors, data streams, knowledge vaults.', pos: [6, 0, 4.2] },
  { key: 'risk',  name: 'Risk Guardian',    role: 'SECURITY HQ',    division: 'Risk',         color: '#ff5d8f', status: 'MONITORING',  perf: 74, body: 'Security HQ — threat monitoring, risk dashboards, protection systems.', pos: [9, 0, 3] },
  { key: 'scout', name: 'Market Scout',     role: 'TRADING FLOOR',  division: 'Capital',      color: '#e3ad28', status: 'TRADING',     perf: 71, body: 'Trading floor — market terminals, asset scanners, live order flow.', pos: [3, 0, 6.5] },
  { key: 'news',  name: 'News Analyst',     role: 'MEDIA CENTER',   division: 'Media',        color: '#a78bfa', status: 'WRITING',     perf: 69, body: 'Media center — news walls, trend dashboards, live feeds.', pos: [6, 0, 7.6] },
  { key: 'trend', name: 'Trend Tracker',    role: 'PREDICTION LAB', division: 'Intelligence', color: '#f0997b', status: 'THINKING',    perf: 68, body: 'Prediction lab — forecast systems, signal monitoring, models.', pos: [9, 0, 6.5] },
];
