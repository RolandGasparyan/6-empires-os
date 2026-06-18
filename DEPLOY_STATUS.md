# 6-EMPIRE OS — Local Deploy Status

**Date:** 2026-06-17 · **Target:** local Docker stack on Rolands-Mac-Studio
**Driven via:** browser web-terminal (ttyd) on `localhost:7681`

---

## ✅ LIVE & VERIFIED (backend)

The full backend stack is running in Docker on your Mac and verified with real
HTTP responses in the browser:

| Service | Container | Status | Port |
|---|---|---|---|
| FastAPI | config-api-1 | Running | `localhost:8000` |
| PostgreSQL | config-postgres-1 | Healthy | 5432 |
| Redis | config-redis-1 | Healthy | 6379 |
| Neo4j | config-neo4j-1 | Up | 7474 / 7687 |

**Verified live (browser):**
- `GET localhost:8000/health` → `{"status":"ok","service":"6-EMPIRE OS API","env":"development"}`
- `GET localhost:8000/api/v1/dashboard/stats` → `{"agents_active":9,"trades_today":12,"pnl":2500.0,"health":98.5}`
- `GET localhost:8000/api/v1/agents` → all 7 division agents
- `localhost:8000/docs` → Swagger UI (HTTP 200)
- Founder auth flow (verified earlier in-session): register → login → JWT;
  founder 200 / non-founder 403 / no-token 401 on gated routes.

**Founder login (local):** email `roland.gasparyan@gmail.com`, password
`EmpireFounder!2026` — **change after first login.**

---

## ⚠️ WEB FRONTEND — builds clean, one runtime error remaining

The Next.js image **builds successfully** (`Image config-web Built`) and the
container runs on `localhost:3001`. But the 3D pages throw a **client-side
runtime error** on load:

```
TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')
```

### Root cause
`@react-three/fiber@8` reads React 18's internal `ReactCurrentBatchConfig` via
`react-reconciler`. In the Next 15 **production** bundle, R3F's reconciler
resolves a React copy where that internal is `undefined` → crash. (Dev mode
usually doesn't hit this; it's a production-bundle React-dedup issue.)

### Fixes already applied this session
- Pinned `@react-three/fiber` to exactly `8.17.10` (was resolving 8.18.0).
- Split `founder/[module]/page.tsx` into an async server page + `ModuleClient`
  (removed React-19-only `use()` — that fix is **correct and shipped**).
- Removed a webpack React-alias that broke RSC `cache()` during build.
- Added `overrides` in `package.json` forcing one React 18.3.1 across the tree
  (queued — needs the rebuild below to take effect).

### Remaining fix (next session, ~10 min)
1. Rebuild web so the new `overrides` regenerate the dependency tree:
   ```bash
   rm -f apps/web/package-lock.json
   docker compose -f config/docker-compose.local.yml build web --no-cache
   docker compose -f config/docker-compose.local.yml up -d --force-recreate web
   ```
2. If `ReactCurrentBatchConfig` persists, the canonical fixes (in order):
   - Add `react-reconciler` resolution: pin `react-reconciler@0.29.2` in
     `overrides` (the version matched to React 18.3 + R3F 8.17).
   - OR run web in dev mode (`next dev`) which sidesteps the prod-bundle dedup:
     change the web service command to `npm run dev`.
   - OR upgrade the stack to React 19 + `@react-three/fiber@9` (the brief's
     original target) — fiber 9 uses React 19's public APIs and avoids the
     removed internal entirely. This is the cleanest long-term fix.

---

## Port remaps (local, to avoid conflicts on your Mac)
- web: host **3001** → container 3000 (3000 was in use)
- qdrant: host **6334** → container 6333 (6333 was in use)

These are local-only; the production compose (`docker-compose.prod.yml`) uses
standard ports behind Nginx.

---

## Manage the stack
```bash
cd ~/6-empires-os
docker compose -f config/docker-compose.local.yml ps      # status
docker compose -f config/docker-compose.local.yml logs -f # logs
docker compose -f config/docker-compose.local.yml down     # stop (keeps data)
bash run-local.sh                                          # one-command relaunch
```
