# 6-EMPIRE OS — System Design

**Author:** Chief AI Architect (Claude) · **Date:** 2026-06-18
**Status:** Design of record for taking the prototype to production.
**Scope:** The full platform — 3D HQ frontend, FastAPI backend, agent
orchestration, real-time digital twin, data stores, and deployment.

> This is an engineering design document, not a build log. It makes the
> architecture explicit so the prototypes already in the repo (3D HQ, agent
> offices, Founder dashboard, FastAPI backend) become a scalable product.
> Decisions are paired with trade-offs and a "revisit when" trigger.

---

## 1. Requirements

### 1.1 Functional
- **3D Headquarters** — navigable luxury HQ (Boss command center, agent floor, per-agent offices) rendered in React Three Fiber.
- **Six division agents** + internal agents (Architect, Developer, Designer, DevOps, QA, Security, Research, Content, Automation) each with role, memory, goals, tasks, reports, workspace.
- **Founder (Empire Boss) control plane** — sees all agents, departments, projects, conversations, revenue, deployments; founder-only auth.
- **Command Chat** — multi-agent conversation, agent mentions, command execution (execute trade, market scan, risk check), voice/file input.
- **Digital twin** — agent status, tasks, markets, analytics, deployments update live.
- **Media + content** — music/video/image generation, research engine (later phase).

### 1.2 Non-functional
| Dimension | Target |
|---|---|
| Concurrent founder sessions | 1–10 (single-tenant to start) |
| Agent count | 6 division + ~9 internal = ~15 live entities |
| Real-time update latency | < 500 ms agent-status → UI |
| 3D frame rate | 60 fps desktop, graceful degrade on mobile |
| API p95 | < 200 ms (cached reads), < 1 s (LLM-backed) |
| Availability | 99% single-VPS; 99.9% target with HA later |
| Security | Founder-only admin, JWT, secrets in env, TLS |

### 1.3 Constraints
- Solo founder + AI agents; no large eng team → **favor managed simplicity over microservice sprawl**.
- Existing stack is committed: Next.js 15 / React 18, FastAPI, Postgres, Redis, Qdrant, Neo4j, Docker, Nginx.
- Single Hostinger VPS to start; must be portable to multi-node later.

---

## 2. High-Level Design

```
                         ┌────────────────────────────────────────┐
                         │           BROWSER (Founder)             │
                         │  Next.js 15 · React 18 · R3F 3D HQ      │
                         │  /hq  /founder  /agents  /command-chat  │
                         └───────┬─────────────────────┬──────────┘
                          HTTPS  │                WSS   │ (live twin)
                         ┌───────▼─────────────────────▼──────────┐
                         │            NGINX (TLS, reverse proxy)   │
                         │  6-empires.com · api. · chat.           │
                         └───────┬─────────────────────┬──────────┘
                   ┌─────────────▼───────┐   ┌─────────▼───────────┐
                   │  FastAPI (REST)     │   │  FastAPI (WebSocket)│
                   │  auth · agents ·    │   │  /ws/updates        │
                   │  dashboard · system │   │  fan-out via Redis  │
                   └──┬───────┬──────┬───┘   └─────────┬───────────┘
                      │       │      │                 │
        ┌─────────────▼┐ ┌────▼───┐ ┌▼──────────┐ ┌────▼─────────┐
        │ PostgreSQL   │ │ Redis  │ │  Qdrant   │ │   Neo4j      │
        │ users,agents,│ │ cache, │ │  vector   │ │  knowledge   │
        │ tasks, audit │ │ pub/sub│ │  memory   │ │  graph       │
        └──────────────┘ └────────┘ └───────────┘ └──────────────┘
                      │
              ┌───────▼────────────────────────────┐
              │     AGENT ORCHESTRATOR (worker)     │
              │  schedules agent runs, calls LLM,   │
              │  writes status/tasks, emits events  │
              └───────┬─────────────────────────────┘
                ┌──────▼──────┐     ┌──────────────┐
                │  LLM API    │     │ Integrations │
                │ (OpenAI etc)│     │ markets, OH  │
                └─────────────┘     └──────────────┘
```

**Data flow (live twin):** Orchestrator updates an agent's status in Postgres →
publishes an event to Redis pub/sub → the WebSocket process fans it out to
connected browsers → R3F updates the agent's status ring/HUD without a reload.

---

## 3. Deep Dive

### 3.1 Data model (Postgres)
```
users(id uuid pk, email uniq, username, hashed_password, full_name,
      is_active, is_admin, created_at, updated_at)

agents(id uuid pk, key uniq, name, role, division, color,
       status enum, load real, throughput int, config jsonb,
       is_active, updated_at)

tasks(id uuid pk, agent_id fk→agents, title, state enum(queued|active|done),
      priority int, payload jsonb, created_at, completed_at)

agent_memory(id uuid pk, agent_id fk, kind enum(decision|ingest|sync|report),
             content text, vector_id text /* → Qdrant point */, created_at)

messages(id uuid pk, channel, sender enum(boss|agent|system), agent_id fk null,
         body text, meta jsonb, created_at)

audit_log(id uuid pk, actor, action, target, meta jsonb, created_at)
```
- **Why Postgres for this:** relational integrity for users/agents/tasks, JSONB for flexible per-agent config — one store, no premature sharding.
- **Vector memory** lives in Qdrant (semantic recall); the row in `agent_memory` keeps the canonical text + a pointer to its Qdrant point.
- **Knowledge graph** (agent↔project↔venture relationships) lives in Neo4j; Postgres holds the entities, Neo4j holds the edges.

### 3.2 API design (REST, already partly built)
```
POST /api/v1/auth/register | login | GET /me
GET  /api/v1/agents                 → list + live status/load
POST /api/v1/agents/{id}/command    (founder) → enqueue task
GET  /api/v1/dashboard/stats|agents|knowledge|timeseries
GET  /api/v1/system/health|logs     (founder)
GET  /api/v1/openhuman/status       (founder)
GET  /api/v1/media/queue            (founder)
WS   /api/v1/ws/updates             → live twin stream
```
- REST for request/response, **WebSocket for the twin** (server-push). Not GraphQL: the surface is small and the twin is event-shaped, so REST+WS is simpler and cheaper to operate.
- Founder-gated routes use the `require_founder` dependency (already built & live-tested: 200/403/401).

### 3.3 Real-time (the digital twin)
- **Redis pub/sub** decouples the orchestrator from the WS process so they scale independently and a WS restart never blocks agent work.
- Browser keeps one WS connection; on reconnect it pulls a REST snapshot then resumes the stream (no lost-update gaps).
- Message shape: `{type:'agent.status', id, status, load, ts}` — small, typed, matches the `useHQ` hook's merge logic already in the repo.

### 3.4 Agent orchestration
- A **worker process** (separate from the API) owns the agent loop: pick queued tasks → call LLM with the agent's role+memory context → write result, update status, append memory, publish event.
- Memory retrieval: embed the task → Qdrant top-k over that agent's points → inject into the prompt (RAG). Keeps prompts bounded and agents "remember."
- **Why a separate worker:** LLM calls are slow and bursty; isolating them keeps the API p95 low and lets you scale workers without scaling the API.

### 3.5 Frontend (3D HQ)
- R3F components already in repo (`components/hq/*`): `HQScene`, `AgentPod`, `BossThrone`, `AgentAvatar`, `CameraRig`, `HQEnvironment`.
- Scenes are `ssr:false` dynamic imports (the `clientScene` pattern) — server never evaluates Three.js, so SSG stays fast.
- Data via `useHQ` hook: mock by default, live `/agents` + WS when `NEXT_PUBLIC_USE_MOCK=false`. **One env var flips the whole app to live.**
- Performance: `AdaptiveDpr`, additive-blend effects, route-level lazy 3D, instanced meshes for repeated geometry (next optimization).

---

## 4. Scale & Reliability

**Load estimate (realistic near-term):** 1 founder + ~15 agents emitting a status event every few seconds = tens of events/sec. Trivial for Redis/WS on one VPS. The cost driver is **LLM calls**, not infra.

| Concern | Now (single VPS) | Revisit when |
|---|---|---|
| API scaling | 1 container | p95 > 500 ms or >50 concurrent users → add replicas behind Nginx |
| Worker scaling | 1 worker | task queue backlog grows → run N workers (Redis queue already supports it) |
| DB | 1 Postgres | >100 GB or read contention → read replica, then partition `agent_memory` |
| Real-time | Redis pub/sub | >10k concurrent sockets → dedicated WS tier / managed pub/sub |
| Availability | restart-on-failure + volumes | need 99.9% → multi-node, managed Postgres, health-checked LB |
| Backups | (gap — add now) | always: nightly `pg_dump` + volume snapshots |

**Reliability gaps to close before "production":**
1. **Backups** — automated Postgres dump + Qdrant/Neo4j volume snapshots.
2. **Rate limiting** — Nginx `limit_req` on auth + command endpoints.
3. **Secrets** — already env-based; add rotation + a real `JWT_SECRET`.
4. **Monitoring** — `/health` exists; add uptime checks + error alerting.
5. **Graceful WS reconnect** — implement snapshot-on-reconnect (above).

---

## 5. Trade-off Analysis (explicit)

| Decision | Chosen | Alternative | Why / Trade-off |
|---|---|---|---|
| API style | REST + WS | GraphQL | Small surface, event-shaped twin → REST+WS simpler & cheaper. Revisit if the client needs flexible nested queries. |
| 3D fidelity | Stylized real-time R3F | Photoreal pre-rendered | Real-time = navigable & live; photoreal renders used as backdrops. Trade visual ceiling for interactivity. |
| Orchestrator | Separate worker | In-API background tasks | Keeps API fast; costs one more process. Worth it for LLM latency isolation. |
| Memory | Qdrant + Postgres pointer | Postgres-only / pgvector | Qdrant scales vector search independently; adds a service. pgvector is the fallback if you want fewer moving parts. |
| Deploy | Docker Compose on 1 VPS | k8s | Solo operator → Compose is right-sized. Migrate to k8s only at multi-node scale. |
| React version | 18 (R3F 8 stable) | 19 + R3F 9 | Stability now; R3F 9/React 19 is the documented upgrade path (avoids the `ReactCurrentBatchConfig` class of issues entirely). |

---

## 6. Build roadmap (phased, each phase shippable)

**Phase A — Make the twin real (current focus).**
Wire `/hq` to live `/agents` + WS; orchestrator writes status; Redis fan-out.
*Exit:* agent rings change in the browser from real backend events.

**Phase B — Agent loop + memory.**
Worker calls LLM with role+RAG context; tasks flow queued→active→done; memory persists to Qdrant.
*Exit:* an agent completes a real task and logs it.

**Phase C — Command Chat.**
Multi-agent channel backed by `messages`; founder commands enqueue tasks; agent replies stream over WS.
*Exit:* founder types a command, an agent acts and reports.

**Phase D — Harden for production.**
Backups, rate limiting, monitoring/alerting, secret rotation, WS reconnect, load test.
*Exit:* the reliability gaps in §4 are all closed.

**Phase E — Media & content engines.**
Music/video/image/research behind the worker, surfaced in the studio routes.

---

## 7. What I'd revisit as it grows
- **Multi-tenant** — today it's single-founder. Adding tenants means a `tenant_id` on every table and row-level isolation; design the migration before the second customer, not after.
- **LLM cost controls** — token budgets per agent, caching of repeated analyses, cheaper models for routine status.
- **Event sourcing** — if the twin's history becomes a product feature, move from "latest status" to an append-only event log.

---

## 8. A note on autonomy (operating model)
The platform runs agents autonomously *within* defined guardrails. The
**deploy/release boundary stays human-gated** — pushes to production, money
movement, and destructive operations require Empire Boss confirmation. This is
deliberate: it's the same control a real CTO keeps, it's what makes the system
investor- and audit-ready, and it's the difference between "autonomous within
policy" (good) and "unsupervised with side effects" (a liability). Everything
up to that gate — planning, building, testing, optimizing — proceeds without
ceremony.
