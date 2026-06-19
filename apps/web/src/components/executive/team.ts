/**
 * 6 EMPIRES CORPORATION — the named Empire Team.
 * Source of truth for every agent: real name, title, color identity, tagline,
 * work gesture, and live status. Drives character profiles, room placement,
 * and the simulation. "Leaders. Innovators. Builders. Champions."
 */
import type { Gesture } from './Character';

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  color: string;       // identity / outfit (suit) accent
  tagline: string;
  blurb: string;
  gesture: Gesture;    // signature working motion
  status: string;
  room: string;        // home department
  // stylized-human look (Simpsons-style rig)
  hair?: string;
  beard?: boolean;
  glasses?: boolean;
  bowtie?: boolean;
}

export const TEAM: TeamMember[] = [
  { id: 'ceo',   name: 'Roland Gasparyan', title: 'CEO & FOUNDER',      color: '#0a0806', tagline: 'Vision. Strategy. Execution.',     blurb: 'Building the future.',            gesture: 'point', status: 'COMMANDING',   room: 'command',   hair: '#141414', beard: true,  bowtie: true },
  { id: 'coo',   name: 'Olivia Bennett',   title: 'COO',                color: '#8e44ad', tagline: 'Operations. People. Process.',     blurb: 'Turning plans into action.',      gesture: 'idle',  status: 'COORDINATING', room: 'workspace', hair: '#5a3a1a' },
  { id: 'cto',   name: 'Daniel Carter',    title: 'CTO',                color: '#16a34a', tagline: 'Code. Architecture. Innovation.',  blurb: 'Engineering the systems.',        gesture: 'type',  status: 'BUILDING',     room: 'datalab',   hair: '#141414', glasses: true },
  { id: 'cfo',   name: 'Sophia Reed',      title: 'CFO',                color: '#ec4899', tagline: 'Numbers. Finance. Growth.',        blurb: 'Fueling sustainable scale.',      gesture: 'think', status: 'ANALYZING',    room: 'workspace', hair: '#3a2410' },
  { id: 'strat', name: 'Marcus Hayes',     title: 'CHIEF STRATEGIST',   color: '#2563eb', tagline: 'Markets. Execution. Leadership.',  blurb: 'Turning data into wins.',         gesture: 'point', status: 'PLANNING',     room: 'meeting',   hair: '#0e0e0e', glasses: true, bowtie: true },
  { id: 'analyst',name: 'Emma Sullivan',   title: 'MARKET ANALYST',     color: '#e8772e', tagline: 'Trends. Insights. Opportunities.', blurb: 'Finding tomorrow today.',         gesture: 'scan',  status: 'SCANNING',     room: 'trading',   hair: '#141414' },
  { id: 'ai',    name: 'Ethan Brooks',     title: 'AI ENGINEER',        color: '#a855f7', tagline: 'AI Systems. Models. Innovation.',  blurb: 'Building intelligent solutions.', gesture: 'type',  status: 'TRAINING',     room: 'datalab',   hair: '#141414', glasses: true },
  { id: 'data',  name: 'Ava Mitchell',     title: 'DATA SCIENTIST',     color: '#d946ef', tagline: 'Data. Models. Insights.',          blurb: 'Turning data into advantage.',    gesture: 'scan',  status: 'MODELING',     room: 'datalab',   hair: '#4a2a5a', glasses: true },
  { id: 'risk',  name: 'James Foster',     title: 'RISK MANAGER',       color: '#1a1a1a', tagline: 'Protect. Manage. Control.',        blurb: 'Securing every move.',            gesture: 'think', status: 'MONITORING',   room: 'trading',   hair: '#141414', beard: true },
  { id: 'auto',  name: 'Noah Parker',      title: 'AUTOMATION LEAD',    color: '#0ea5e9', tagline: 'Automate. Optimize. Scale.',       blurb: 'Building systems that scale.',    gesture: 'type',  status: 'AUTOMATING',   room: 'workspace', hair: '#141414' },
  { id: 'mkt',   name: 'Mia Coleman',      title: 'MARKETING DIRECTOR', color: '#06b6d4', tagline: 'Brand. Growth. Positioning.',      blurb: 'Making an empire known.',         gesture: 'wave',  status: 'CREATING',     room: 'lounge',    hair: '#1a6a7a' },
  { id: 'ops',   name: 'Liam Turner',      title: 'OPERATIONS MANAGER', color: '#1e3a5f', tagline: 'Systems. Flow. Efficiency.',       blurb: 'Making everything run.',          gesture: 'idle',  status: 'RUNNING',      room: 'workspace', hair: '#141414' },
];

export const byId = (id: string) => TEAM.find((t) => t.id === id);
export const byRoom = (room: string) => TEAM.filter((t) => t.room === room);
