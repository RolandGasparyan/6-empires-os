export const FOUNDER_MODULES = [
  { slug: 'chat',     name: 'Founder Chat',     glyph: '✦', desc: 'Direct line to the Empire intelligence core' },
  { slug: 'ai',       name: 'AI Control Center',glyph: '◈', desc: 'LLM, embeddings, vector + agent router' },
  { slug: 'agents',   name: 'Agent Control',    glyph: '⬡', desc: 'Command the 7 division agents' },
  { slug: 'openhuman',name: 'OpenHuman',        glyph: '⊕', desc: 'Personal intelligence & data sync' },
  { slug: 'brain',    name: 'Knowledge Brain',  glyph: '✸', desc: 'Graph, vectors, semantic search' },
  { slug: 'memory',   name: 'Memory Graph',     glyph: '❖', desc: 'Long-term memory & relationships' },
  { slug: 'health',   name: 'System Health',    glyph: '♥', desc: 'Infra, containers, resources' },
  { slug: 'logs',     name: 'Live Logs',        glyph: '≣', desc: 'Realtime system event stream' },
  { slug: 'security', name: 'Security Monitor', glyph: '⛨', desc: 'Auth, firewall, rate limiting' },
] as const;
