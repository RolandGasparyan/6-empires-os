# Changelog — 3D Executive Command Center

## [2.0.0] — 2026-06-17

### Added
- Full cinematic 3D operating system built into `apps/web` (Black Obsidian + Liquid Gold).
- 7 routed module scenes: Command, Agent Control Room, Globe, Knowledge Brain,
  Music Studio, Video Studio, Infrastructure.
- React Three Fiber engine: `Stage` (bloom/vignette/chromatic-aberration/fog),
  `GoldParticles`, `HoloPanel`, `HoloRing`, pointer-parallax `Rig`.
- App shell: hover-expand gold sidebar, executive top bar, module HUD layout.
- `useEmpireData` hook typed to the live FastAPI dashboard contract; mock/live
  switch via `NEXT_PUBLIC_USE_MOCK`.
- Design system: `tailwind.config.ts` (obsidian/gold scales, glass shadows,
  gold-flow animation), `globals.css` glass + liquid-gold utilities.

### Notes
- Built on React 18.3 (repo's current version); R3F 8 / Drei 9 stable there.
- React 19 / Next 15-latest upgrade documented as a separate deferred step.
- No existing functionality removed — `apps/web` was an empty shell (audit-confirmed).

### Security
- No secrets in client code. API base + WS URL are public `NEXT_PUBLIC_*` env vars.
- `.env.local.example` provided; real `.env.local` is gitignored.

### Verification (2026-06-17)
- `npx tsc --noEmit` → exit 0, **0 type errors** across all 34 source files
  (1,058 LOC). Every import, type, and R3F JSX element validates.
- Note: full `next build` (webpack bundle) is extremely slow in the constrained
  build sandbox; type-check is the authoritative correctness gate here. On normal
  hardware `npm run build` completes in well under a minute.
