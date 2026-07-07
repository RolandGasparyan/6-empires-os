# 6-EMPIRE OS — Master Architecture (Production-Grade)

**Author:** Chief AI Architect (Claude), wearing CEO / CTO / Lead Architect /
Sr. Product Designer / Sr. Full-Stack / DevOps / AI Systems / Game Systems /
Enterprise Solutions Architect hats.
**Date:** 2026-06-18 · **Supersedes:** SYSTEM-DESIGN.md (extends, not replaces).
**Status:** The authoritative target. Current build = Phases A+B done (live twin +
agent loop), 3D HQ + isometric tower prototyped.

---

## 0. Honest baseline — what exists vs. what this designs

| Built & verified | Designed here (not yet built) |
|---|---|
| FastAPI backend, founder auth (200/403/401) | Multi-tenant, RBAC beyond founder |
| Live agent-state engine + WebSocket twin (Phase A) | Redis pub/sub, horizontal WS tier |
| Agent loop: task queue + worker + memory (Phase B) | LLM orchestration at scale, tool use |
| 3D HQ + agent offices + isometric tower (R3F) | Full 10-floor navigable build, photoreal backdrops |
| Docker Compose, Nginx, deploy kit | CI/CD, IaC, observability, backups |

This document closes that right-hand column.

---

## 1. The 10-point production critique (required by directive)

### 1.1 Missing components
- **CI/CD pipeline** — no automated test/build/deploy. *Add: GitHub Actions → build, tsc, pytest, Docker push, deploy.*
- **Persistence for agent state** — Phase A/B state is in-memory; a restart wipes tasks/memory. *Add: Postgres-backed tasks/memory + Qdrant for vector recall.*
- **Auth depth** — only founder vs. not. *Add: roles (founder, operator, viewer, agent-service), refresh tokens, session revocation.*
- **Observability** — no metrics/tracing/log aggregation. *Add: OpenTelemetry, Prometheus, Grafana, Sentry.*
- **Backups/DR** — none. *Add: nightly pg_dump + volume snapshots + restore runbook.*
- **Rate limiting & abuse controls** — none at the edge. *Add: Nginx limit_req + per-token quotas.*
- **LLM cost governance** — unbounded. *Add: per-agent token budgets, caching, model tiering.*

### 1.2 Weak areas
- In-process orchestrator couples agent work to the API event loop → move to a dedicated worker (Celery/Arq/RQ on Redis).
- WebSocket fan-out is single-process → Redis pub/sub so any API replica can broadcast.
- 3D scenes re-mount on route change → a persistent canvas + scene-graph swap to keep 60fps and avoid GPU re-init.

### 1.3 Scalability limits
- Single VPS, single Postgres, single worker. Fine to ~10 users / 15 agents. Past that: API replicas behind Nginx, Postgres read replica, N workers, managed Redis, then partition `agent_memory`.

### 1.4 UX improvements
- **Onboarding flow** — first-run founder setup wizard (create account → name the empire → meet the agents).
- **Command palette** (⌘K) — jump to any floor/agent/action; the JARVIS layer.
- **Empty/loading states** — photoreal reference renders as cinematic loaders (the hybrid).
- **Reduced-motion + perf tiers** — auto-detect GPU, drop bloom/particles on weak hardware.
- **Mobile** — the 3D tower degrades to a 2.5D floor list; HUD stays usable.

### 1.5 Automation opportunities
- Scheduled agent runs (cron-style): "every market open, Market Scout scans."
- Event-driven chains: a Data Hunter report auto-enqueues a Strategist review.
- Self-healing: health-check failure auto-restarts a container and alerts.
- Auto-scaling workers by queue depth.

### 1.6 AI enhancements
- **RAG memory** (designed in Phase B) → wire to Qdrant for real recall.
- **Tool use** — agents call real tools (market data, web, code exec) via a typed tool registry, founder-gated for side-effects.
- **Multi-agent orchestration** — a planner agent decomposes a founder goal into sub-tasks across agents (the "corporation" behavior).
- **Guardrails** — every side-effectful tool call passes a policy check + founder confirm.

### 1.7 Revenue opportunities
- Tiered SaaS (Solo / Team / Empire) once multi-tenant.
- Agent marketplace — install pre-built agents (the plugin pattern).
- Usage-based AI billing (token passthrough + margin).
- White-label the 3D HQ for other AI-ops companies.

### 1.8 Production risks
- In-memory state loss on restart (highest current risk).
- Secret leakage — mitigated (env-based) but needs rotation + a vault.
- LLM cost runaway — needs budgets before any public exposure.
- WebSocket connection storms — needs backpressure + reconnect jitter (reconnect is built).
- 3D performance on low-end devices — needs the perf-tier system.

### 1.9 Security improvements
- JWT rotation + short-lived access + refresh tokens.
- Per-route RBAC (not just founder boolean).
- Rate limiting + WAF rules at Nginx.
- Audit log on every founder/agent side-effect (table designed below).
- TLS everywhere (configured), HSTS (configured), secret manager (add).
- Founder confirm gate on money/deploy/destructive actions — **non-negotiable, by design**.

### 1.10 Performance optimizations
- Persistent R3F canvas; instanced meshes for repeated furniture/agents; LOD per floor.
- DRACO-compressed glTF for any imported models; texture atlasing.
- API: Redis cache on hot reads; DB indexes on `agent_id`, `state`, `created_at`.
- WS: delta frames only (already event-shaped), client-side throttle of ring re-renders.
- Web: route-level code splitting (done via ssr:false), `next/image` for backdrops.

---

## 2. Complete architecture

```
                    ┌─────────────────────── CLIENTS ───────────────────────┐
                    │  3D HQ (R3F)  ·  Command Chat  ·  Working Console      │
                    │  persistent canvas · ⌘K palette · perf tiers · mobile  │
                    └───────────────┬───────────────────┬────────────────────┘
                            HTTPS    │              WSS  │
                    ┌───────────────▼───────────────────▼────────────────────┐
                    │  EDGE: Nginx — TLS, HSTS, rate-limit, WAF, 4 domains    │
                    └───────────────┬───────────────────┬────────────────────┘
                    ┌───────────────▼────────┐  ┌────────▼───────────────────┐
                    │  API replicas (FastAPI)│  │  WS gateway (FastAPI)       │
                    │  REST · RBAC · validate│  │  subscribes Redis pub/sub   │
                    └──┬────────┬────────┬───┘  └────────┬────────────────────┘
                       │        │        │               │ pub/sub
              ┌────────▼┐ ┌─────▼───┐ ┌──▼────────┐ ┌────▼──────────────────┐
              │Postgres │ │ Redis   │ │  Qdrant   │ │  Neo4j                │
              │ +replica│ │cache+bus│ │  vectors  │ │  knowledge graph      │
              │ tasks,  │ │ +queue  │ │  memory   │ │  agent↔project↔venture│
              │ memory, │ └─────────┘ └───────────┘ └───────────────────────┘
              │ audit   │
              └────┬────┘
          ┌────────▼──────────────────────────────────┐
          │  WORKER POOL (Arq/Celery on Redis)         │
          │  agent runs · planner · tool calls · RAG   │
          └───────┬───────────────────┬────────────────┘
            ┌──────▼─────┐      ┌──────▼───────────────┐
            │  LLM router │      │  Tool registry        │
            │ (tiered)    │      │ market·web·code·OH    │
            └─────────────┘      └───────────────────────┘
   OBSERVABILITY: OpenTelemetry → Prometheus/Grafana · Sentry · log aggregation
   CI/CD: GitHub Actions → tsc/pytest/build → image → deploy · IaC for infra
```

---

## 3. Complete data model (Postgres, production)

```sql
-- identity & access
users(id uuid pk, email uniq, username, hashed_password, full_name,
      role enum('founder','operator','viewer'), is_active, created_at, updated_at)
refresh_tokens(id uuid pk, user_id fk, token_hash, expires_at, revoked_at)

-- the corporation
agents(id uuid pk, key uniq, name, role, division, color,
       status enum, load real, throughput int, config jsonb, is_active, updated_at)
tasks(id uuid pk, agent_id fk, title, state enum('queued','active','done','failed'),
      priority int, payload jsonb, result text, error text,
      created_at, started_at, completed_at)
agent_memory(id uuid pk, agent_id fk, kind enum('decision','report','sync','ingest'),
             content text, vector_id text, importance real, created_at)
messages(id uuid pk, channel, sender enum('founder','agent','system'),
         agent_id fk null, body text, mentions text[], meta jsonb, created_at)

-- governance
audit_log(id uuid pk, actor, action, target, before jsonb, after jsonb,
          requires_confirm bool, confirmed_by uuid null, created_at)
schedules(id uuid pk, agent_id fk, cron text, task_template jsonb, enabled bool)

-- indexes
idx tasks(agent_id, state, created_at) · idx agent_memory(agent_id, created_at)
idx messages(channel, created_at) · idx audit_log(created_at)
```
Migrations via **Alembic** (replaces the dev-time `create_all`).

---

## 4. Complete API design

```
AUTH      POST /auth/register · /auth/login · /auth/refresh · /auth/logout · GET /auth/me
AGENTS    GET /agents · GET /agents/{id} · GET /agents/{id}/tasks · /memory
          POST /agents/{id}/command           (operator+; side-effect tools → founder confirm)
CHAT      GET /channels · GET /channels/{c}/messages · POST /channels/{c}/messages
          POST /chat/mention  (route a message to one/all agents)
CONSOLE   GET /console/overview (projects·tasks·trading·revenue·research·deploys·health)
SCHED     GET/POST/DELETE /schedules           (founder)
SYSTEM    GET /health · GET /system/health|logs (founder) · GET /metrics (internal)
WS        /ws/updates  — frames: snapshot · agent.status · task.* · memory.add · message.new
```
Contract rules: REST for request/response, WS for the twin; every mutation
validated (Pydantic), authorized (RBAC dep), and audited. Side-effect tools
(trade/deploy/transfer) **require an explicit founder confirm** and are logged.

---

## 5. Complete agent system

- **Roster:** 6 division agents (Strategist, Data Hunter, Market Scout, Risk Guardian, News Analyst, Trend Tracker) + internal (Architect, Developer, Designer, DevOps, QA, Security, Research, Content, Automation).
- **Anatomy:** role, system-prompt persona, memory (Qdrant RAG), task queue, tool grants, performance metrics, themed 3D office.
- **Loop (built in B, scaled here):** task → worker → plan → retrieve memory (RAG) → think (LLM router) → optional tool calls (policy-gated) → result → memory write → twin events.
- **Planner agent:** decomposes a founder goal ("grow revenue 10%") into sub-tasks routed across agents — the emergent "corporation."
- **Guardrails:** tool registry is typed; side-effects flagged `requires_confirm`; nothing touching money/deploy executes without founder approval.

---

## 6. Complete workflow system
- **Triggers:** manual (founder command), scheduled (cron), event (another agent's output), webhook (external).
- **Chains:** declarative DAG — node = agent task, edge = data dependency. Stored in `schedules.task_template` / a `workflows` table.
- **Execution:** worker resolves the DAG, runs ready nodes in parallel, streams progress to the twin (files/messages "flowing" in the 3D HQ = real edges firing).
- **Visualization:** the directive's "files flowing / projects progressing" maps 1:1 to workflow edges animating in the tower.

---

## 7. Complete UX / UI
- **Three surfaces, one world:** (1) 3D HQ/Tower — navigate, watch, enter offices; (2) Command Chat — converse, assign; (3) Working Console — the dense Bloomberg-style live dashboard.
- **Design system:** locked tokens — black marble `#121013`, emerald `#0e3a2a`, antique gold `#d4af50`/`#f6d987`; glass+metal materials; warm ambient + gold key lighting; Sora/Inter/JetBrains type; cinematic composition.
- **Hybrid fidelity:** real-time R3F for interaction; photoreal reference renders as loaders + room backdrops.
- **Patterns:** ⌘K command palette, founder confirm modals for side-effects, reduced-motion + GPU perf tiers, mobile 2.5D fallback.

---

## 8. Complete deployment plan
- **Environments:** dev (Compose, mock data), staging (VPS, real services, test data), prod (HA).
- **CI/CD (GitHub Actions):** on push → tsc + pytest + `next build` → build & push images → deploy to staging → smoke tests → manual promote to prod (the human gate).
- **IaC:** docker-compose for single-node now; Terraform module when multi-node.
- **Prod topology:** Nginx LB → 2+ API replicas + WS gateway + N workers + managed Postgres (+replica) + Redis + Qdrant + Neo4j; certbot auto-renew.
- **Backups:** nightly `pg_dump`, volume snapshots, documented restore drill.
- **Rollback:** tagged images; `down`/`up` keeps volumes; data-safe.
- **Enterprise observability overlay:** every environment carries metrics, logs, traces, dashboards, alerts, error tracking, infrastructure health, AI health, and business KPIs as defined by `../operations/PRODUCTION-READINESS-CHECKLIST.md`.
- **Disaster recovery overlay:** backup cadence, recovery ownership, restore drills, and business continuity are part of deployment design, not an appendix; governance lives in `../OPERATING-MANUAL.md`, readiness evidence in `../operations/PRODUCTION-READINESS-CHECKLIST.md`.

---

## 9. Complete security plan
- **AuthN:** bcrypt, JWT access (short) + refresh (rotating, revocable).
- **AuthZ:** per-route RBAC; founder-only gate on admin + side-effects (live-tested).
- **Edge:** TLS 1.2/1.3, HSTS, security headers, Nginx rate-limit, WAF rules.
- **Secrets:** env now → secret manager (Vault/SOPS) + rotation.
- **Audit:** every founder/agent side-effect logged with before/after + confirmer.
- **AI safety:** tool policy checks; no autonomous money/deploy; prompt-injection guarding on any external content agents ingest.
- **Compliance posture:** audit log + RBAC + backups = the SOC2-readiness foundation (the "investor-ready" the directive wants).
- **Security operations center discipline:** threat detection, secret scanning, vulnerability/dependency scanning, audit review, RBAC control, and incident response are required operating practices for any production release; execution evidence is tracked in `../operations/PRODUCTION-READINESS-CHECKLIST.md`.
- **Approval boundary:** deploys, destructive actions, permission-model changes, and financial side effects remain founder-gated under the operating rules in `../OPERATING-MANUAL.md` and `../governance/AI-GOVERNANCE.md`.

---

## 10. Complete scaling plan
| Stage | Trigger | Move |
|---|---|---|
| 0 → now | single founder | 1 VPS, Compose |
| 1 | p95 > 500ms / >50 users | API replicas + Redis pub/sub WS |
| 2 | queue backlog | N workers, autoscale by depth |
| 3 | DB contention | Postgres read replica, cache layer |
| 4 | >100GB memory | partition `agent_memory`, archive cold |
| 5 | multi-region / multi-tenant | tenant_id everywhere, managed data tier, k8s, CDN for 3D assets |

---

## 11. Sequenced roadmap (each phase shippable)
- **A. Live twin** ✅ done · **B. Agent loop + memory** ✅ done
- **C. Command Chat** — multi-agent channel, mentions, task assignment over WS.
- **D. Working Console** — the live executive dashboard.
- **E. Persistence** — move A/B state to Postgres + Qdrant (closes top risk).
- **F. Harden** — CI/CD, observability, backups, rate-limit, RBAC depth.
- **G. Tower build-out** — full 10-floor navigable HQ, photoreal backdrops, perf tiers.
- **H. Orchestration & tools** — planner agent, typed tool registry, workflow DAGs.
- **I. Scale & multi-tenant** — when revenue demands it.
- The phase roadmap here is the technical delivery sequence. The broader business and lifecycle roadmap is maintained in `../roadmap/ENTERPRISE-ROADMAP.md`.

---

## 12. The autonomy boundary (operating model)
Agents operate autonomously **within policy**: plan, research, build, test,
optimize, report — no ceremony. The **deploy/release and money/destructive
boundary stays founder-gated** by design. This is not a limitation to engineer
around; it is the control that makes the system auditable, investor-ready, and
safe to run 24/7. "Autonomous within policy" — not "unsupervised with side
effects."

---

## 13. Operating-manual alignment
- `../OPERATING-MANUAL.md` defines the executive operating model above this architecture.
- `../governance/AI-GOVERNANCE.md` defines approvals, responsibilities, and escalation.
- `../governance/AI-MEMORY-ARCHITECTURE.md` defines durable memory classes and refresh policy.
- `../governance/AI-COMMUNICATION-PROTOCOL.md` defines handoff and status rules across agent roles.
- `../governance/MULTI-AGENT-ORCHESTRATION.md` defines scheduler, dependency, and recovery policy.
- `../governance/SELF-IMPROVEMENT-FRAMEWORK.md` defines the continuous-improvement operating loop.
- `../roadmap/ENTERPRISE-ROADMAP.md` defines lifecycle staging beyond the technical phases here.
- `../operations/PRODUCTION-READINESS-CHECKLIST.md` defines the release gate that every implementation must satisfy before founder acceptance.
