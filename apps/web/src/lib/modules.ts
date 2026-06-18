// Canonical module registry — drives nav, routing, and the command rail.
export interface ModuleDef { slug: string; name: string; division: string; glyph: string; route: string; }

export const MODULES: ModuleDef[] = [
  { slug: 'hq',             name: 'Empire HQ',          division: '3D Headquarters',            glyph: '∞', route: '/hq' },
  { slug: 'chat',            name: 'Command Chat',       division: 'Intelligence Core',          glyph: '✷', route: '/chat' },
  { slug: 'console',         name: 'Working Console',    division: 'Strategic Authority',        glyph: '▦', route: '/console' },
  { slug: 'command',        name: 'Executive Command', division: 'Strategic Authority',        glyph: '◆', route: '/' },
  { slug: 'agents',         name: 'Agent Control Room', division: 'Intelligence Core',          glyph: '⬡', route: '/agents' },
  { slug: 'globe',          name: 'Global Operations',  division: 'Expansion Protocol',         glyph: '◉', route: '/globe' },
  { slug: 'brain',          name: 'Knowledge Brain',    division: 'Intelligence Core',          glyph: '✸', route: '/brain' },
  { slug: 'music',          name: 'Music Studio',       division: 'Media Systems',              glyph: '♪', route: '/music' },
  { slug: 'video',          name: 'Video Studio',       division: 'Media Systems',              glyph: '▷', route: '/video' },
  { slug: 'infrastructure', name: 'Infrastructure',     division: 'Automation Infrastructure',  glyph: '▤', route: '/infrastructure' },
];
