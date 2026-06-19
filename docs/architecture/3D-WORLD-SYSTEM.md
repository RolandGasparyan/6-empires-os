# 6 EMPIRES CORPORATION — 3D World System Architecture

A living, interactive isometric corporate HQ built in **React Three Fiber**.
Stylized original characters, real-time simulation, premium black-marble + gold
aesthetic with per-department accent colors. This document is the system spec;
the MVP (`/command`, 1 room + 3 named agents) is the executable proof.

---

## 1. Scene Architecture

**Rendering:** R3F `<Canvas>` (Three.js r0.169, pinned single instance),
`reactStrictMode:false`, `transpilePackages` for the R3F ecosystem. One Canvas
per route; scenes are dynamically imported `ssr:false` via `clientScene()` so
SSG never touches WebGL.

**Scene graph (per room):**
```
<Canvas>
  background + fog
  lighting rig (ambient · directional+shadow · gold key point · accent points · gold spot)
  <Suspense>
    MeshReflectorMaterial floor + gold ring inlay
    back wall + floating Empire emblem + city windows
    desks / workstations (RoundedBox + gold trim)
    animated Screens (chart/bars/map/code/grid)
    rotating Hologram (globe + data nodes)
    Characters (named agents) + ProjectBoard + Plants
    LivingOffice (NPC walkers · coffee cluster · notifications)
    Particles · ContactShadows · Environment(night)
  </Suspense>
  CameraRig (intro orbit → settle)
```

**Reusable room engine:** `roomKit.tsx` exposes `DepartmentRoom({cfg, signature})`
— a room is a `DeptConfig` (palette, screens, agent, copy) + optional signature
props. Executive, Research, and Command rooms all share it. Adding a department
= one config object + a few signature meshes.

**Files:** `components/executive/roomKit.tsx` (engine + primitives),
`departments.ts` (room configs), `*Scene.tsx` (per-room composition).

---

## 2. Character System

**Rig:** `Character.tsx` — a stylized original character (NOT a generic robot):
tapered body, soft rounded head with a dark visor band, glossy white eyes,
cheeks, antenna with glowing tip, shoulder-pivoted arms with hands, little feet,
status ring, billboarded nameplate + speech bubble.

**Identity:** driven by `team.ts` — the **named Empire Team** (12 members:
Aram Voskanyan/CEO … Hayk Azatyan/Operations Manager) each with `name`, `title`,
`color` (outfit accent), `tagline`, `blurb`, `gesture`, `status`, `room`.

**Expression:** periodic blink (timed scale-Y on eyes), wandering eye look,
subtle head sway. Identity color tints body + emissive + status ring.

---

## 3. Animation System

Native R3F `useFrame` (per-frame, no external tween dependency for the loop;
GSAP available for scripted sequences if needed).

- **Idle:** body bob (sin), gentle yaw sway, arm micro-motion.
- **Gestures** (per role): `type` (alternating fast arm swing), `wave`,
  `point`, `think` (hand-to-head + head tilt), `celebrate` (both arms up),
  `scan` (head sweep). Selected by `cfg.gesture` / `member.gesture`.
- **Screens:** emissive pulse; `bars` scale-Y noise; `code` line-length noise;
  `chart` static polyline; `hologram` continuous Y-rotation.
- **Living office:** walkers traverse parametric loops with a walk-bounce;
  notifications float-and-fade; speech bubbles cycle on a timer.
- **Camera:** intro orbit that lerps in then settles (`CameraRig`/`Rig`).

---

## 4. Interaction System

- **Camera:** orbit (drag) · zoom (scroll) · auto intro framing.
- **Pick:** `<Inspect id onPick>` wraps any object → `onClick` (stopPropagation)
  fires a typed pick; `onPointerOver/Out` drives hover highlight + cursor.
- **Agent → profile:** clicking a `Character` opens a team-card-style panel
  (color header, name, title, tagline, blurb, live status).
- **Object → info:** desk/screens/board/hologram/logo open contextual panels.
- **Room → zoom** (world view): clicking a department flies the camera in.

---

## 5. Data Simulation System

- **Backend twin:** FastAPI engine streams `agent.status` over WebSocket
  (`/api/v1/ws/updates`); `useWorldLive` maps agent keys → display names and
  feeds live statuses into the 3D agents (real ANALYZING/TRADING/…).
- **Local simulation:** screens, bars, holograms, notifications, walker paths,
  and speech bubbles run on `useFrame`/timers so the office is alive even with
  no backend. Statuses fall back to each member's configured `status`.
- **Productivity states:** per-agent `status` + animated performance bars; live
  panels (P&L, win rate, throughput) on the analytics screens.

---

## 6. File + Folder Structure

```
apps/web/src/
  app/
    command/page.tsx        # STEP 2 MVP — Central Command (3 named agents)
    executive/page.tsx      # Executive Command Center
    research/page.tsx       # Research Center
    world/page.tsx          # navigable multi-room campus (front door)
    empire/page.tsx         # trading command dashboard
  components/
    executive/
      Character.tsx         # the stylized character rig + gesture system
      team.ts               # the named 12-agent Empire Team (source of truth)
      roomKit.tsx           # room engine + Screen/Hologram/Agent/Board/Particles/Rig
      departments.ts        # per-department DeptConfig registry
      LivingOffice.tsx      # walkers · coffee cluster · notifications
      CommandRoomScene.tsx  # MVP room composition
      ExecutiveScene.tsx / ResearchScene.tsx
      DeptPage.tsx          # shared gate + audio + inspect-panel chrome
      useExecAudio.ts       # procedural Web Audio ambience
      liveContext.ts        # live-status React context
    world/                  # isometric campus (EmpireWorld, Room, Furniture)
    three/SceneLoader.tsx   # clientScene() ssr:false wrapper
  public/empire-logo.svg · empire-mark.svg
```

**Deploy:** Dockerized (web + api) behind host Nginx on the VPS, served at
`https://6-empires.com` (rooms at `/command`, `/executive`, `/research`, `/`).
