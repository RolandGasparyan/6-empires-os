# 6-EMPIRE OS — 3D Executive Command Center

**Status:** Implementation-ready · wired into `apps/web` · React 18 + Next 15
**Aesthetic:** Black Obsidian Glass + Liquid Gold · Apple Vision Pro / JARVIS / Palantir
**Data mode:** Mock by default, real-data-ready (one env var to go live)

---

## 1. What was discovered (Phase 1–3 audit)

- `apps/web` existed as an **empty Next.js shell** — `src/app` and all component
  folders were present but contained **no files**, no `next.config`, `tsconfig`,
  or Tailwind config. This was greenfield inside an existing monorepo.
- `apps/api` (FastAPI) exposes a concrete contract we built against:
  - `GET /api/v1/dashboard/stats` → `{ agents_active, trades_today, pnl, health }`
  - `GET /api/v1/dashboard/agents` → `{ total, active[] }`
  - `GET /api/v1/dashboard/knowledge` → `{ documents, entities, relationships }`
  - `WS  /api/v1/ws/updates`
- Docker config already provisions Postgres / Redis / Qdrant / Neo4j.

**Decision:** upgrade the existing `apps/web` in place (per project rule:
*prefer upgrading existing systems, never duplicate*). No parallel project created.

---

## 2. Folder structure

```
apps/web/
├─ next.config.js · tsconfig.json · tailwind.config.ts · postcss.config.js
├─ .env.local.example                # NEXT_PUBLIC_USE_MOCK toggle
└─ src/
   ├─ app/                           # Next.js App Router — one route per module
   │  ├─ layout.tsx                  # fonts (Sora/Inter/JetBrains) + AppShell
   │  ├─ globals.css                 # glass, liquid-gold, scanlines
   │  ├─ page.tsx                    # / · Executive Command
   │  ├─ agents/page.tsx             # /agents · Agent Control Room
   │  ├─ globe/page.tsx              # /globe · Global Operations
   │  ├─ brain/page.tsx              # /brain · Knowledge Brain
   │  ├─ music/page.tsx              # /music · Music Studio
   │  ├─ video/page.tsx              # /video · Video Studio
   │  └─ infrastructure/page.tsx     # /infrastructure · Infra Layer
   ├─ components/
   │  ├─ three/                      # ── 3D engine (R3F) ──
   │  │  ├─ Stage.tsx                # cinematic Canvas: bloom+vignette+CA+fog
   │  │  ├─ GoldParticles.tsx        # animated additive gold particle field
   │  │  ├─ HoloPanel.tsx            # floating 3D glass data panel
   │  │  ├─ HoloRing.tsx             # rotating holographic rings
   │  │  └─ Rig.tsx                  # pointer-parallax camera rig
   │  ├─ ui/                         # ── 2D HUD overlay ──
   │  │  ├─ GlassCard.tsx · MetricTile.tsx · ModuleHeader.tsx
   │  └─ shell/
   │     ├─ AppShell.tsx · Sidebar.tsx · TopBar.tsx · ModuleLayout.tsx
   ├─ modules/                       # one R3F scene per division
   │  ├─ CommandScene · AgentsScene · GlobeScene · BrainScene
   │  ├─ MediaScenes (Music+Video) · InfraScene
   ├─ data/
   │  ├─ mock.ts                     # designed mock data (7 agents, globe nodes…)
   │  └─ useEmpireData.ts            # hook — mock OR live FastAPI (env toggle)
   ├─ lib/
   │  ├─ tokens.ts                   # palette shared with Three.js
   │  ├─ types.ts                    # API contract types (mirror dashboard.py)
   │  └─ modules.ts                  # module registry → nav + routing
   └─ store/                         # reserved for zustand global UI state
```

---

## 3. Component tree

```
RootLayout
└─ AppShell
   ├─ Sidebar        (gold rail, 7 modules, hover-expand, active glow)
   ├─ TopBar         (clock, feed status, live agents/health/P&L)
   └─ <route>Page
      └─ ModuleLayout
         ├─ <Module>Scene          ← React Three Fiber <Stage>
         │   ├─ GoldParticles
         │   ├─ HoloPanel / HoloRing / scene-specific meshes
         │   └─ EffectComposer (Bloom · ChromaticAberration · Vignette)
         └─ HUD overlay (ModuleHeader + GlassCard/MetricTile, pointer-events-auto)
```

The 3D scene is the full-bleed background; the HUD is a non-interactive grid on
top, with interactive zones opting back in via `pointer-events-auto`. This is the
Vision-Pro pattern: depth behind, crisp glass UI in front.

---

## 4. The 7 modules (scene design)

| Route | Division | 3D scene |
|---|---|---|
| `/` | Strategic Authority | Distorted obsidian icosahedron core, 3 holo-rings, 4 floating data panels, 1600-particle gold field, pointer parallax |
| `/agents` | Intelligence Core | CEO dodecahedron core + 7 orbiting agent octahedra (size = load, color = status), spoke links |
| `/globe` | Expansion Protocol | Wireframe globe, 8 geo nodes with pulse rings, bezier arc data-streams between hubs, auto-rotate |
| `/brain` | Intelligence Core | 120-node neural cloud with proximity edges + wireframe core; semantic-search input |
| `/music` | Media Systems | 72-bar reactive waveform on a reflective grid; AI Composer prompt panel |
| `/video` | Media Systems | Carousel of render-preview planes; live render-queue HUD |
| `/infrastructure` | Automation Infra | 8 service cubes (green=healthy, red=warning), pulsing heartbeat, grid floor |

---

## 5. Data strategy (real-data-ready)

`useEmpireData()` is the single source of truth.
- `NEXT_PUBLIC_USE_MOCK=true` (default): polished animated mock metrics that
  "breathe" (P&L/health jitter).
- `NEXT_PUBLIC_USE_MOCK=false`: polls `/dashboard/stats|agents|knowledge` every
  5s from `NEXT_PUBLIC_API_BASE`. **The data shape is identical**, so going live
  is a one-line env change — no component edits.
- Types in `lib/types.ts` mirror `dashboard.py` exactly; the extended
  `EmpireAgent` model is the designed target the backend can grow into.

---

## 6. Performance & quality

- `dpr={[1,2]}` + `<AdaptiveDpr>` — scales resolution under load.
- Additive blending + `depthWrite:false` on particles/lines — cheap glow.
- `mipmapBlur` bloom — soft volumetric light without a full volumetric pass.
- All scenes are `'use client'`; Canvas is lazy by route (no 3D on first paint of
  other routes).

## 7. React 19 upgrade (documented, deferred)

Repo runs React 18.3 today; R3F 8 / Drei 9 are fully stable there. To adopt the
brief's React 19 + Next 15-latest: bump `react`, `react-dom` to 19, `@react-three/fiber`
to v9 (its React-19 line), retest postprocessing. Tracked as a separate change to
avoid destabilizing the working build.
