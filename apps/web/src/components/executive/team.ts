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

// Faces match the OUR EMPIRE TEAM + CEO character-sheet mockups (Simpsons-yellow).
// Names kept English; only the boss is Roland Gasparyan. color = outfit/identity accent.
export const TEAM: TeamMember[] = [
  { id: 'ceo',   name: 'Roland Gasparyan', title: 'CEO & FOUNDER',      color: '#1a1a1a', tagline: 'Vision. Strategy. Execution.',     blurb: 'Building the future.',            gesture: 'point', status: 'COMMANDING',   room: 'command',   hair: '#141414', beard: true,  bowtie: true },
  { id: 'coo',   name: 'Olivia Bennett',   title: 'COO',                color: '#7e3ea8', tagline: 'Operations. People. Process.',     blurb: 'Turning plans into action.',      gesture: 'idle',  status: 'COORDINATING', room: 'workspace', hair: '#5a3a1a' },
  { id: 'cto',   name: 'Daniel Carter',    title: 'CTO',                color: '#1f8a4c', tagline: 'Code. Architecture. Innovation.',  blurb: 'Engineering the systems.',        gesture: 'type',  status: 'BUILDING',     room: 'datalab',   hair: '#141414', glasses: true },
  { id: 'cfo',   name: 'Sophia Reed',      title: 'CFO',                color: '#ee6aa0', tagline: 'Numbers. Finance. Growth.',        blurb: 'Fueling sustainable scale.',      gesture: 'think', status: 'ANALYZING',    room: 'workspace', hair: '#5a3a1a' },
  { id: 'strat', name: 'Marcus Hayes',     title: 'CHIEF STRATEGIST',   color: '#2f5fd0', tagline: 'Markets. Execution. Leadership.',  blurb: 'Turning data into wins.',         gesture: 'point', status: 'PLANNING',     room: 'meeting',   hair: '#0e0e0e', glasses: true, bowtie: true },
  { id: 'analyst',name: 'Emma Sullivan',   title: 'MARKET ANALYST',     color: '#e2622a', tagline: 'Trends. Insights. Opportunities.', blurb: 'Finding tomorrow today.',         gesture: 'scan',  status: 'SCANNING',     room: 'trading',   hair: '#141414' },
  { id: 'ai',    name: 'Ethan Brooks',     title: 'AI ENGINEER',        color: '#7a3fd0', tagline: 'AI Systems. Models. Innovation.',  blurb: 'Building intelligent solutions.', gesture: 'type',  status: 'TRAINING',     room: 'datalab',   hair: '#141414', glasses: true },
  { id: 'data',  name: 'Ava Mitchell',     title: 'DATA SCIENTIST',     color: '#b83fc4', tagline: 'Data. Models. Insights.',          blurb: 'Turning data into advantage.',    gesture: 'scan',  status: 'MODELING',     room: 'datalab',   hair: '#6a2a7a', glasses: true },
  { id: 'risk',  name: 'James Foster',     title: 'RISK MANAGER',       color: '#1a1a1a', tagline: 'Protect. Manage. Control.',        blurb: 'Securing every move.',            gesture: 'think', status: 'MONITORING',   room: 'trading',   hair: '#141414', beard: true, glasses: true },
  { id: 'auto',  name: 'Noah Parker',      title: 'AUTOMATION LEAD',    color: '#2f6fd0', tagline: 'Automate. Optimize. Scale.',       blurb: 'Building systems that scale.',    gesture: 'type',  status: 'AUTOMATING',   room: 'workspace', hair: '#141414', glasses: true },
  { id: 'mkt',   name: 'Mia Coleman',      title: 'MARKETING DIRECTOR', color: '#15b0c0', tagline: 'Brand. Growth. Positioning.',      blurb: 'Making an empire known.',         gesture: 'wave',  status: 'CREATING',     room: 'media',     hair: '#15a6c0' },
  { id: 'ops',   name: 'Liam Turner',      title: 'OPERATIONS MANAGER', color: '#24406a', tagline: 'Systems. Flow. Efficiency.',       blurb: 'Making everything run.',          gesture: 'idle',  status: 'RUNNING',      room: 'workspace', hair: '#141414', glasses: true },
  { id: 'music', name: 'Leo Vance',        title: 'MUSIC AI PRODUCER',  color: '#b83fc4', tagline: 'Sound. Songs. Suno.',              blurb: 'Generating tracks with Suno AI.', gesture: 'type',  status: 'GENERATING',   room: 'media',     hair: '#1a1430' },
  { id: 'video', name: 'Zoe Hart',         title: 'VIDEO & REELS AI',   color: '#06b6d4', tagline: 'Video. Reels. Virality.',          blurb: 'Generating video content & reels.', gesture: 'scan',  status: 'RENDERING',    room: 'media',     hair: '#15a6c0' },
];

export const byId = (id: string) => TEAM.find((t) => t.id === id);
export const byRoom = (room: string) => TEAM.filter((t) => t.room === room);
