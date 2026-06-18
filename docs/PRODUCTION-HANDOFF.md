# 6-EMPIRE OS — Production Handoff Audit

**Date:** 2026-06-18 · **Scope:** Get A–F + C + D running before Phase H.
All figures below were read from the working tree, not estimated.

---

## 1–3. Git status
- **Branch:** `claude/great-lovelace-aq1yww`
- **Last commit:** `29ca5e6 feat(A,B,C,E,F): live twin, agent loop+memory, persistence, hardening, command chat + 3D HQ` (committed)
- **Uncommitted = Phase D only:** 2 modified, 3 new, 0 deleted
  - M `apps/api/app/api/v1/endpoints/__init__.py` (console router wired)
  - M `apps/web/tsconfig.tsbuildinfo` (build cache — should be gitignored)
  - ?? `apps/api/app/api/v1/endpoints/console.py`
  - ?? `apps/web/src/app/console/page.tsx`
  - ?? `apps/web/src/data/useConsole.ts`

> Phases A, B, C, E, F are already in git history. Only Phase D awaits commit.

## 4. Components (created this program)
**Backend** `apps/api/app` — services: `agent_state`, `agent_brain`, `agent_repo`,
`chat_service`, `metrics`; models: `user`(+RefreshToken), `agent_runtime`(tasks+memory),
`message`; endpoints: auth, agents, chat, console, dashboard, system, media, openhuman, websocket.
**Frontend** `apps/web/src` — 13 routes; 6 R3F HQ components; 6 three/ primitives; shell + ui;
7 data hooks (`useTwin`, `useHQ`, `useChat`, `useConsole`, …); auth store; founder gate.

## 5. API routes (23 + WS)
auth: register · login · refresh · logout · me
agents: list · {id}/command · {id}/tasks · {id}/memory
chat: channels · channels/{c}/messages (GET/POST)
console: overview
dashboard: stats · agents · knowledge · timeseries
system: health · logs · media/queue · openhuman ×3 · /health
**WS:** `/api/v1/ws/updates`

## 6. Frontend routes (13)
`/` · `/hq` · `/chat` · `/console` · `/agents` · `/brain` · `/globe` · `/music` ·
`/video` · `/infrastructure` · `/founder` · `/founder/login` · `/founder/[module]`

## 7. Database tables (7)
`users`, `refresh_tokens`, `agents`, `tasks`, `agent_memory`, `messages`, `knowledge_documents`.
(Created on startup via `init_db`; use Alembic for prod migrations.)

## 8. WebSocket event types (6)
`snapshot` · `agent.status` · `task.active` · `task.done` · `memory.add` · `message.new`

## 9. Environment variables
Core: `ENV`, `APP_NAME` · DB: `DATABASE_URL` · `REDIS_URL` · `QDRANT_URL`
Auth: `JWT_SECRET` (required), `JWT_ALGORITHM`, `JWT_EXPIRE_HOURS`, `REFRESH_EXPIRE_DAYS`, `FOUNDER_EMAIL`
CORS: `CORS_ORIGINS` · AI: `OPENAI_API_KEY` (optional — enables real LLM)
OpenHuman: `OPENHUMAN_CLIENT_ID/SECRET/CORE_TOKEN/RUNTIME_URL` (optional)
Web: `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_USE_MOCK`

## 10. Startup commands
**Fastest (Docker, one shot):**
```bash
cd ~/6-empires-os
docker compose -f config/docker-compose.local.yml build api web
docker compose -f config/docker-compose.local.yml up -d
docker compose -f config/docker-compose.local.yml ps
# web → http://localhost:3001    api → http://localhost:8000/docs
```
**Dev (no Docker):**
```bash
# API
cd apps/api && pip install -r requirements.txt aiosqlite && \
ENV=development JWT_SECRET=dev DATABASE_URL="sqlite+aiosqlite:///./empire.db" \
  uvicorn main:app --reload --port 8000
# Web (new shell)
cd apps/web && npm install && \
NEXT_PUBLIC_API_BASE=http://localhost:8000/api/v1 \
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1/ws/updates \
NEXT_PUBLIC_USE_MOCK=false npm run dev
```

Verified at audit time: **web tsc 0 errors · api compiles · 23 routes · 7 tables.**

---

# COMMIT PLAN

One commit completes the tree (Phase D):
```bash
cd ~/6-empires-os
echo "apps/web/tsconfig.tsbuildinfo" >> .gitignore   # stop tracking build cache
git rm --cached apps/web/tsconfig.tsbuildinfo 2>/dev/null || true
git add -A
git commit -m "feat(D): Working Console — live executive dashboard (/console + /console/overview)"
git push origin claude/great-lovelace-aq1yww
```
After this, A–F + C + D are fully in history. Tag it:
```bash
git tag -a v0.6.0 -m "6-EMPIRE OS — A–F + C + D" && git push --tags
```

---

# RELEASE PLAN (v0.6.0 "Living Corporation")
**Contents:** 3D HQ + tower · live digital twin · agent loop + memory (persisted) ·
RBAC + refresh tokens · rate-limit + metrics + CI + backups · Command Chat · Working Console.
**Gate checklist before tagging:**
- [ ] `git push` succeeds (Phase D committed)
- [ ] CI green on GitHub Actions (api + web + images jobs)
- [ ] `docker compose ... up` → all 6 services healthy
- [ ] `localhost:3001/hq`, `/chat`, `/console` render; founder login works
- [ ] `curl localhost:8000/health` → ok; `/metrics` returns
**Known deferred (documented, not blockers):** Phase G (full tower build-out),
Phase H (orchestration), multi-tenant, managed observability deploy.

---

# DEPLOYMENT PLAN
**Local (now — get it running on your Mac):** use §10 Docker block. Set
`NEXT_PUBLIC_USE_MOCK=false` so the twin/console pull live data.

**Production (Hostinger VPS — when ready):** follow `DEPLOYMENT.md` + `deploy/`:
1. DNS A-records for the 4 hostnames → VPS IP.
2. `cp .env.example .env`; set `JWT_SECRET` (`openssl rand -hex 32`), DB/Neo4j passwords, `FOUNDER_EMAIL`, optional `OPENAI_API_KEY`.
3. Issue SSL (certbot bootstrap in DEPLOYMENT.md).
4. `docker compose -f config/docker-compose.prod.yml up -d --build` (8 services incl. Nginx + certbot).
5. Register founder → log in at `/founder/login`.
6. `bash deploy/scripts/healthcheck.sh` + `db-probe.sh`; schedule `backup.sh` via cron.
7. Wire CI deploy as a **manual promote** (human gate) and point Grafana/Sentry at `/metrics`.

**The boundary, restated:** git push (your GitHub auth), Docker build/run (your Mac),
and VPS deploy (your server) all execute on your machine. The code is verified;
those steps need you. Once §10 runs green, the full A–F + C + D system is live and
Phase H can begin on a running foundation.
