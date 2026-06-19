import type { DeptConfig } from './roomKit';

/** Per-department identity — colors, agent, screens, inspect copy. */
export const DEPARTMENTS: Record<string, DeptConfig> = {
  executive: {
    id: 'executive', title: '6 EMPIRES', subtitle: 'EXECUTIVE COMMAND CENTER',
    primary: '#d4af37', secondary: '#3b82f6', agentColor: '#e8e6df',
    agentName: 'EMPIRE BOSS', agentStatus: 'COMMANDING', agentGesture: 'point',
    walkerColors: ['#3b82f6', '#34f5a0', '#a855f7', '#e8772e'],
    bubbles: ['Reviewing Q3 strategy…', 'Markets up 8.2% ✦', 'Deploying agents…', 'Empire status: optimal'],
    screens: [{ kind: 'chart', accent: 'green' }, { kind: 'bars', accent: 'gold' }, { kind: 'map', accent: 'secondary' }],
    inspect: {
      agent: { title: 'EMPIRE BOSS', accent: '#e8e6df', body: 'Strategic authority of the corporation. Commands all departments and agents.', lines: [['Status', 'COMMANDING'], ['Decisions today', '47'], ['Agents directed', '12']] },
      screens: { title: 'EXECUTIVE ANALYTICS', accent: '#34f5a0', body: 'Real-time empire performance: P&L curve, agent throughput, global map.', lines: [['P&L (24h)', '+$12,450'], ['Win rate', '78.6%'], ['Throughput', '846 tasks/h']] },
      hologram: { title: 'GLOBAL OPERATIONS', accent: '#3b82f6', body: 'Live world hologram — empire reach across markets and regions.', lines: [['Active regions', '14'], ['Markets', 'Crypto · FX · Equities']] },
      desk: { title: 'EXECUTIVE DESK', accent: '#d4af37', body: 'Black-marble command desk with live triple-screen analytics.', lines: [['Material', 'Obsidian + gold'], ['Screens', '3 live']] },
      board: { title: 'PROJECT BOARD', accent: '#3b82f6', body: 'Physical kanban of the empire’s active initiatives.', lines: [['Scheduled', '3'], ['Active', '3'], ['Done', '3']] },
      logo: { title: '6 EMPIRES', accent: '#d4af37', body: 'One vision, six minds, endless empire.', lines: [['Motto', 'WE BUILD · WE TRADE · WE OWN'], ['Level', '6']] },
    },
  },

  research: {
    id: 'research', title: 'RESEARCH CENTER', subtitle: 'INTELLIGENCE & KNOWLEDGE',
    primary: '#a855f7', secondary: '#6366f1', agentColor: '#a855f7',
    agentName: 'DATA HUNTER', agentStatus: 'SCANNING', agentGesture: 'scan',
    walkerColors: ['#a855f7', '#6366f1', '#3b82f6'],
    bubbles: ['Scanning 1,240 sources…', 'New trend detected ✦', 'Indexing knowledge graph…', 'Sentiment: bullish'],
    screens: [{ kind: 'grid', accent: 'primary' }, { kind: 'chart', accent: 'secondary' }, { kind: 'bars', accent: 'primary' }],
    inspect: {
      agent: { title: 'DATA HUNTER', accent: '#a855f7', body: 'Scans global data, detects trends, and feeds the empire’s knowledge graph.', lines: [['Status', 'SCANNING'], ['Sources/min', '1,240'], ['Reports today', '38']] },
      screens: { title: 'MARKET INTELLIGENCE', accent: '#6366f1', body: 'Live data walls — sentiment, trend signals, and knowledge indexing.', lines: [['Signals', '212 active'], ['Confidence', '91%'], ['Coverage', '47 markets']] },
      hologram: { title: 'KNOWLEDGE HOLOGRAM', accent: '#a855f7', body: 'The empire’s knowledge graph — entities and their relationships, live.', lines: [['Entities', '18,402'], ['Relations', '64,118']] },
      desk: { title: 'RESEARCH DESK', accent: '#d4af37', body: 'Analyst station wired to every data wall in the center.', lines: [['Feeds', '12 live'], ['Indexing', 'real-time']] },
      board: { title: 'RESEARCH QUEUE', accent: '#6366f1', body: 'Active research initiatives across the empire.', lines: [['Scheduled', '3'], ['Active', '3'], ['Done', '3']] },
      datawall: { title: 'DATA WALL', accent: '#a855f7', body: 'Floor-to-ceiling intelligence display — every market, every signal.', lines: [['Panels', '6'], ['Refresh', '2s']] },
      logo: { title: '6 EMPIRES', accent: '#d4af37', body: 'Intelligence Core of the empire.', lines: [['Division', 'Research'], ['Level', '6']] },
    },
  },
};
