// 6-EMPIRE OS — shared design tokens consumed by Three.js (which can't read Tailwind).
export const PALETTE = {
  obsidian: '#040405',
  obsidian2: '#0d0f14',
  goldDeep: '#a8790f',
  gold: '#e3ad28',
  goldBright: '#f6d987',
  cyan: '#3fe0ff',
  danger: '#ff4d5e',
  success: '#34f5a0',
} as const;

export const GOLD = PALETTE.gold;
export const GOLD_BRIGHT = PALETTE.goldBright;
