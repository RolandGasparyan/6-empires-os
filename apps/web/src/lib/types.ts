// API contract — mirrors apps/api/app/api/v1/endpoints/dashboard.py exactly.
export interface DashboardStats {
  agents_active: number;
  trades_today: number;
  pnl: number;
  health: number;
}
export interface AgentSummary { name: string; status: string; }
export interface AgentsResponse { total: number; active: AgentSummary[]; }
export interface KnowledgeResponse { documents: number; entities: number; relationships: number; }

// Extended client-side models (designed; backend can grow into these).
export type AgentRole =
  | 'CEO' | 'Intelligence' | 'Capital' | 'Automation'
  | 'Venture' | 'Media' | 'Expansion';

export interface EmpireAgent {
  id: string;
  name: string;
  role: AgentRole;
  status: 'executing' | 'idle' | 'thinking' | 'offline';
  load: number;        // 0..1
  throughput: number;  // tasks/min
}
