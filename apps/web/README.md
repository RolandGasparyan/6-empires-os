# 6-EMPIRE OS — 3D Executive Command Center (`@6empires/web`)

Cinematic 3D operating system for the 6-EMPIRE AI corporation.
Black Obsidian Glass + Liquid Gold · Apple Vision Pro / JARVIS aesthetic.

## Run

```bash
cd apps/web
npm install          # installs Next 15, R3F, Drei, postprocessing, framer-motion
npm run dev          # http://localhost:3000
```

By default the dashboard runs on animated **mock data**. To wire it to the live
FastAPI backend (`apps/api`), copy `.env.local.example` to `.env.local` and set:

```
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE=http://localhost:8000/api/v1
```

The data shape is identical in both modes — no component changes needed.

## 7 Modules

| Route | Module |
|---|---|
| `/` | Executive Command Center |
| `/agents` | AI Agent Control Room |
| `/globe` | Interactive Global Operations |
| `/brain` | Knowledge Brain (neural graph) |
| `/music` | Music Studio |
| `/video` | Video Studio |
| `/infrastructure` | Infrastructure Layer |

## Verified

- `npx tsc --noEmit` → **0 errors** (all 34 files type-check clean).
- Architecture, component tree, and scene design: `docs/architecture/3D-COMMAND-CENTER.md`.

## Stack

Next.js 15 · React 18.3 · TypeScript · TailwindCSS · Three.js · React Three Fiber ·
Drei · @react-three/postprocessing (Bloom/Vignette/ChromaticAberration) · Framer Motion · Zustand.
