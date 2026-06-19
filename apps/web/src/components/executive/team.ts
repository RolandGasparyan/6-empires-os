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
  color: string;       // identity / outfit accent
  tagline: string;
  blurb: string;
  gesture: Gesture;    // signature working motion
  status: string;
  room: string;        // home department
}

export const TEAM: TeamMember[] = [
  { id: 'ceo',   name: 'Roland Gasparyan', title: 'CEO & FOUNDER',      color: '#c0392b', tagline: 'Vision. Strategy. Execution.',     blurb: 'Building the future.',            gesture: 'point', status: 'COMMANDING',   room: 'command' },
  { id: 'coo',   name: 'Olivia Bennett',   title: 'COO',                color: '#8e44ad', tagline: 'Operations. People. Process.',     blurb: 'Turning plans into action.',      gesture: 'idle',  status: 'COORDINATING', room: 'workspace' },
  { id: 'cto',   name: 'Daniel Carter',    title: 'CTO',                color: '#16a34a', tagline: 'Code. Architecture. Innovation.',  blurb: 'Engineering the systems.',        gesture: 'type',  status: 'BUILDING',     room: 'datalab' },
  { id: 'cfo',   name: 'Sophia Reed',      title: 'CFO',                color: '#ec4899', tagline: 'Numbers. Finance. Growth.',        blurb: 'Fueling sustainable scale.',      gesture: 'think', status: 'ANALYZING',    room: 'workspace' },
  { id: 'strat', name: 'Marcus Hayes',     title: 'CHIEF STRATEGIST',   color: '#2563eb', tagline: 'Markets. Execution. Leadership.',  blurb: 'Turning data into wins.',         gesture: 'point', status: 'PLANNING',     room: 'meeting' },
  { id: 'analyst',name: 'Emma Sullivan',   title: 'MARKET ANALYST',     color: '#e8772e', tagline: 'Trends. Insights. Opportunities.', blurb: 'Finding tomorrow today.',         gesture: 'scan',  status: 'SCANNING',     room: 'trading' },
  { id: 'ai',    name: 'Ethan Brooks',     title: 'AI ENGINEER',        color: '#a855f7', tagline: 'AI Systems. Models. Innovation.',  blurb: 'Building intelligent solutions.', gesture: 'type',  status: 'TRAINING',     room: 'datalab' },
  { id: 'data',  name: 'Ava Mitchell',     title: 'DATA SCIENTIST',     color: '#d946ef', tagline: 'Data. Models. Insights.',          blurb: 'Turning data into advantage.',    gesture: 'scan',  status: 'MODELING',     room: 'datalab' },
  { id: 'risk',  name: 'James Foster',     title: 'RISK MANAGER',       color: '#b45309', tagline: 'Protect. Manage. Control.',        blurb: 'Securing every move.',            gesture: 'think', status: 'MONITORING',   room: 'trading' },
  { id: 'auto',  name: 'Noah Parker',      title: 'AUTOMATION LEAD',    color: '#0ea5e9', tagline: 'Automate. Optimize. Scale.',       blurb: 'Building systems that scale.',    gesture: 'type',  status: 'AUTOMATING',   room: 'workspace' },
  { id: 'mkt',   name: 'Mia Coleman',      title: 'MARKETING DIRECTOR', color: '#06b6d4', tagline: 'Brand. Growth. Positioning.',      blurb: 'Making an empire known.',         gesture: 'wave',  status: 'CREATING',     room: 'lounge' },
  { id: 'ops',   name: 'Liam Turner',      title: 'OPERATIONS MANAGER', color: '#f59e0b', tagline: 'Systems. Flow. Efficiency.',       blurb: 'Making everything run.',          gesture: 'idle',  status: 'RUNNING',      room: 'workspace' },
];

export const byId = (id: string) => TEAM.find((t) => t.id === id);
export const byRoom = (room: string) => TEAM.filter((t) => t.room === room);
