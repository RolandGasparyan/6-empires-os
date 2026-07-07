# 6-EMPIRE OS — Executive Operating Manual

**Status:** Governing manual for organization, delivery, memory, and control layers.  
**Relationship to architecture:** This manual sits above `docs/architecture/MASTER-ARCHITECTURE.md` and `docs/architecture/SYSTEM-DESIGN.md`. It does not replace them.

---

## 1. Purpose
This manual defines how 6-EMPIRE OS is governed, evolved, approved, reviewed, and kept coherent across future sessions. The architecture documents define the system design; this manual defines the operating model that keeps the design maintainable, scalable, secure, documented, and founder-aligned.

## 2. Document hierarchy

### Vision / operating manual
- `docs/OPERATING-MANUAL.md` — executive operating model and document map.

### Architecture / system design
- `docs/architecture/MASTER-ARCHITECTURE.md` — authoritative target architecture.
- `docs/architecture/SYSTEM-DESIGN.md` — design-of-record baseline.
- `docs/architecture/3D-COMMAND-CENTER.md` — world and UI structure.
- `docs/architecture/3D-WORLD-SYSTEM.md` — scene/system details.

### Security / SOC / disaster recovery
- `docs/architecture/MASTER-ARCHITECTURE.md#8-complete-deployment-plan`
- `docs/architecture/MASTER-ARCHITECTURE.md#9-complete-security-plan`
- `docs/operations/PRODUCTION-READINESS-CHECKLIST.md`

### Delivery roadmap / readiness / risk
- `docs/roadmap/ENTERPRISE-ROADMAP.md`
- `docs/operations/PRODUCTION-READINESS-CHECKLIST.md`
- `docs/PRODUCTION-HANDOFF.md`

### Agent organization / governance / memory
- `docs/governance/AI-GOVERNANCE.md`
- `docs/governance/AI-MEMORY-ARCHITECTURE.md`
- `docs/governance/AI-COMMUNICATION-PROTOCOL.md`
- `docs/governance/MULTI-AGENT-ORCHESTRATION.md`
- `docs/governance/SELF-IMPROVEMENT-FRAMEWORK.md`

### Knowledge / founder / venture systems
- `docs/knowledge/KNOWLEDGE-RAINFOREST-ENGINE.md`
- `docs/founder/FOUNDER-INTELLIGENCE-CONSOLE.md`
- `docs/products/STARTUP-FACTORY-ENGINE.md`
- `docs/business/BUSINESS-OPERATING-SYSTEM.md`

---

## 3. Operating principles
1. Architecture is a first-class product.
2. Governance is explicit, not implicit.
3. Memory is structured, versioned, and reviewable.
4. Human approval remains mandatory for high-impact actions.
5. Every initiative must improve documentation, observability, and rollback readiness.
6. Existing modules are reused before new modules are introduced.
7. Missing information is researched and inferred carefully before escalation.

## 4. Section requirements for all new operating-manual documents
Every operating-manual document must define:
- purpose
- ownership
- inputs and outputs
- dependencies
- approval model
- operational risks
- observability requirements
- future evolution path

## 5. Repository knowledge model
The repository memory system is normalized into the following durable registers:
- **Architecture memory** — structural decisions, boundaries, interfaces, deployment topology.
- **Decision memory** — approved architectural and product decisions with rationale.
- **Project memory** — active initiatives, milestones, dependencies, status changes.
- **Risk register** — current delivery, security, operational, and business risks.
- **Technical debt register** — known compromises, cleanup scope, and impact.
- **Improvement backlog** — validated opportunities for platform improvement.
- **Innovation backlog** — experimental ideas not yet accepted into delivery.

The canonical operating rules for those memory layers are defined in `docs/governance/AI-MEMORY-ARCHITECTURE.md`.

## 6. Approval boundaries

### Founder approval required
- production deploys and promotions
- money movement or revenue-impacting automations
- destructive actions
- permission model changes
- security policy exceptions
- architectural changes that alter platform boundaries

### Automatic approval allowed
- read-only analysis
- documentation updates aligned with existing decisions
- low-risk internal refactors within approved architecture
- non-destructive validation and observability work

### Blocked actions
- invented APIs, schemas, or business logic
- undocumented critical architecture changes
- bypassing approval gates for deploy, finance, or destructive actions
- introducing secrets or unreviewed side-effectful automation

### Emergency controls
- emergency stop disables side-effectful agent execution
- rollback uses the documented deployment rollback path
- escalation flows route unresolved risk to founder review

## 7. Completion gate
No initiative is complete until all of the following are explicitly addressed:
- implementation
- tests
- documentation
- architecture alignment
- security review
- performance review
- deployment readiness
- monitoring
- rollback strategy
- risk assessment
- future improvement recommendations

The operational checklist is maintained in `docs/operations/PRODUCTION-READINESS-CHECKLIST.md`.

## 8. Overlap policy
The following areas already exist in the technical architecture and must be extended there instead of duplicated elsewhere:
- roadmap sequencing
- observability
- security operations
- deployment readiness
- backups and disaster recovery

This manual cross-links those areas and defines their governance context; `docs/architecture/MASTER-ARCHITECTURE.md` remains the technical source of truth.
