# ADR 0001 — Establish governance and verification baseline

**Date:** 2026-07-07  
**Status:** Proposed on branch `rg20260707`; accepted when merged by the Founder.  
**Decision owners:** Founder, CTO, Chief Architect  

---

## Context

6-EMPIRE OS is evolving from a feature/code repository into a long-lived AI-native operating system. The repository already contains architecture documentation, API/web implementations, deployment files, CI configuration, agent runtime code, and historical verification reports.

However, the repository did not yet have a formal executive engineering operating manual, ADR baseline, or current verification report that separates repository-verified facts from historical claims and live infrastructure assumptions.

The Founder also defined permanent operating rules for the AI engineering organization: plan before implementation, analyze the repository first, reuse existing modules, document decisions, avoid fake implementations, avoid invented APIs/schemas/business logic, and treat knowledge as a first-class product.

---

## Decision

Create a governance baseline consisting of:

1. `docs/governance/EXECUTIVE-ENGINEERING-OPERATING-MANUAL.md`
   - Defines the executive engineering organization, lifecycle, AI governance, memory architecture, communication protocol, orchestration model, observability, SOC, disaster recovery, startup factory, business OS, Founder console, production readiness, ADR rules, data governance, and release governance.
2. `docs/governance/REPOSITORY-VERIFICATION-REPORT-2026-07-07.md`
   - Captures repository evidence inspected through GitHub and records verified status, known gaps, evidence conflicts, risks, and the next implementation sequence.
3. This ADR.
   - Makes the governance baseline an explicit architecture decision rather than an informal chat instruction.

This decision changes documentation and process only. It does not change runtime behavior, API contracts, deployment behavior, database schemas, or business logic.

---

## Alternatives considered

### Alternative A — Continue using chat instructions only

Rejected. Chat instructions are not durable repository knowledge. A long-lived engineering organization needs versioned, reviewable, repository-local governance.

### Alternative B — Implement runtime changes immediately

Rejected for this step. The Founder’s own rules require repository analysis, architecture alignment, and decision documentation before larger runtime changes.

### Alternative C — Put all governance into the existing master architecture document

Rejected. The existing master architecture document describes system architecture and target implementation. Governance, operating model, verification reports, and ADRs should be separate documents with clear ownership and review workflows.

---

## Consequences

Positive consequences:

- Governance becomes versioned and reviewable.
- Future AI sessions can ground work in repository documents rather than relying on chat memory.
- Production-readiness claims must be evidence-based.
- Runtime changes now have a documented lifecycle and completion standard.
- Missing verification gates become explicit work items rather than hidden risk.

Tradeoffs:

- More documentation must be maintained.
- Engineering velocity may feel slower because architecture, tests, security, documentation, and rollback must be considered before implementation.
- Historical readiness claims must be normalized against current observable evidence.

---

## Required follow-up checks

The next runtime PRs should address the highest-risk verification gaps:

1. Strict CI test gate: remove `pytest -q || echo "no tests yet"` and add baseline tests.
2. Web runtime validation: build and smoke-test the production bundle in browser.
3. Production secret enforcement: fail API boot in production when default secrets are used.
4. Migration hardening: introduce Alembic migration ownership and runbook.
5. Observability hardening: define metric names, dashboards, alerts, and ownership.
6. Deployment evidence: capture VPS, DNS, SSL, container health, and rollback proof.

---

## Supersedes / superseded by

This is the first ADR. It does not supersede prior ADRs.

Future ADRs should cover:

- Authentication and RBAC model
- Agent runtime persistence model
- AI autonomy and approval boundary
- Deployment topology
- Observability stack
- Data governance and knowledge memory architecture
