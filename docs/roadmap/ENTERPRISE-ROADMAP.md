# Enterprise Roadmap

## Purpose
Define the lifecycle from current state to autonomous company, with milestones, dependencies, risks, and review gates.

## Ownership
Founder for strategic approval; CTO/Chief Architect for sequencing; delivery leads for execution tracking.

## Inputs and outputs
**Inputs:** architecture status, delivery capacity, risk register, technical debt register, business priorities.  
**Outputs:** quarterly roadmap, monthly goals, weekly objectives, sprint plans, milestone decisions.

## Dependencies
- `docs/architecture/MASTER-ARCHITECTURE.md`
- `docs/PRODUCTION-HANDOFF.md`
- `docs/operations/PRODUCTION-READINESS-CHECKLIST.md`

## Approval model
Roadmap structure may be updated automatically when it preserves approved direction. Stage changes, milestone exits, and priority shifts require founder approval.

## Operating roadmap
| Stage | Objective | Exit condition |
|---|---|---|
| Current State | Consolidate prototype, docs, and deployment assets | Architecture, governance, and readiness docs aligned |
| MVP | Deliver live founder workflows on a stable base | Core user journeys validated end-to-end |
| Alpha | Harden internal usage | Persistence, observability, security basics in place |
| Beta | Controlled expansion | Reliability, approval gates, DR drills, and support workflows active |
| Production | Founder-operable platform | Production readiness checklist fully green |
| Enterprise | Formalize governance and business operations | Auditability, RBAC depth, reporting, and SOC discipline active |
| Scale | Expand workload and tenancy | Performance, automation, and cost controls proven |
| Global Platform | Multi-region and cross-company operation | Regional resilience and global control plane ready |
| Autonomous Company | AI-native operating company | Approved autonomy boundaries enforced and continuously monitored |

## Planning cadence
- **Quarterly roadmap:** strategic outcomes, platform investments, capability upgrades.
- **Monthly goals:** scope slices, risk retirement, operational hardening.
- **Weekly objectives:** execution priorities, blockers, approval needs.
- **Sprint planning:** implementation batches mapped to architecture phases.

## Milestone controls
Every milestone must record:
- owner
- success criteria
- dependent systems
- approval gate
- rollback path
- top three risks

## Resource allocation model
Resources are allocated across:
- core platform
- AI systems
- knowledge/memory
- security and reliability
- founder workflow enablement
- venture creation systems

## Operational risks
- roadmap inflation without architectural capacity
- business priorities outrunning platform controls
- underfunded reliability and documentation work
- hidden dependencies across agent, data, and founder surfaces

## Observability requirements
Track milestone status, blocked dependencies, release readiness, security exceptions, and capacity drift in the founder console.

## Future evolution path
Promote this roadmap into a live, queryable planning system once the founder console and workflow orchestration layers become operational.
