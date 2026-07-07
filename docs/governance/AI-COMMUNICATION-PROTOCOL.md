# AI Communication Protocol

## Purpose
Define how planner, architect, developer, reviewer, QA, security, deployment, monitoring, and learning functions exchange tasks, context, status, and decisions.

## Ownership
Platform and architecture leadership own the protocol; all specialist agents must conform to it.

## Inputs and outputs
**Inputs:** founder requests, routed tasks, architecture context, validation results, incidents, approvals.  
**Outputs:** routed work items, status updates, escalation events, acceptance/rejection decisions, learning records.

## Dependencies
- `docs/governance/AI-GOVERNANCE.md`
- `docs/governance/MULTI-AGENT-ORCHESTRATION.md`
- `docs/governance/AI-MEMORY-ARCHITECTURE.md`

## Protocol stages
Planner → Architect → Developer → Reviewer → QA → Security → Deployment → Monitoring → Learning

## Task routing rules
- route by domain ownership first
- attach authoritative context before execution
- reject ambiguous tasks that lack scope or approval
- preserve citations and validation evidence between stages

## Priority rules
1. security and incident response
2. production stability
3. founder-approved strategic work
4. architecture and debt retirement
5. exploratory improvements

## Shared context contract
Every handoff must include:
- objective
- constraints
- dependencies
- approval status
- validation status
- unresolved risks

## Conflict resolution
Conflicts are resolved by evidence order:
1. repository source of truth
2. approved architecture/design docs
3. verified runtime evidence
4. founder direction
5. inferred assumptions

## Retry policy
Retries are allowed for transient failures, missing context enrichment, or validation reruns. Retries are blocked for approval failures and policy violations until conditions change.

## Status reporting
Each stage reports: received, in progress, blocked, validated, escalated, or complete.

## Approval model
Only approved downstream states may trigger deployment or side-effectful actions. Monitoring and learning may continue automatically after release within policy.

## Operational risks
- context loss across handoffs
- duplicate execution
- hidden blockers surfacing too late
- escalation loops without ownership

## Observability requirements
Track handoff latency, blocked state frequency, retry rates, escalation counts, unresolved conflicts, and dropped-context incidents.

## Future evolution path
Formalize this protocol on an internal event bus with typed payloads and policy-enforced routing.
