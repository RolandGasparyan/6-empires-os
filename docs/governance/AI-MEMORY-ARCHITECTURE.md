# AI Memory Architecture

## Purpose
Define how short-term, working, project, repository, business, founder, knowledge, historical, decision, and archive memory are organized, retrieved, and governed.

## Ownership
Knowledge engineering owns structure; architecture owns technical boundaries; founder owns approval for sensitive long-term memory policy.

## Inputs and outputs
**Inputs:** task history, architecture docs, repository changes, business context, approved decisions, incident learnings.  
**Outputs:** retrievable memory records, memory indexes, refresh tasks, archive events, cleanup actions.

## Dependencies
- `docs/OPERATING-MANUAL.md`
- `docs/knowledge/KNOWLEDGE-RAINFOREST-ENGINE.md`
- `docs/governance/AI-COMMUNICATION-PROTOCOL.md`

## Memory layers
| Layer | Role | Retention |
|---|---|---|
| Short-term memory | Current turn/task context | session-scoped |
| Working memory | Active implementation and validation context | task-scoped |
| Project memory | Initiative status, milestones, blockers | active project lifecycle |
| Repository memory | Stable codebase facts and conventions | long-lived |
| Business memory | Market, company, revenue, and operating context | long-lived |
| Founder memory | Founder preferences and durable directives | long-lived with approval controls |
| Knowledge memory | Research, documents, and linked concepts | versioned |
| Historical memory | Prior sessions, releases, and incidents | permanent archive |
| Decision memory | Approved decisions with rationale | permanent archive |
| Long-term archive | Inactive but auditable records | retained for recovery and traceability |

## Retrieval model
Memory retrieval must combine:
- exact references for authoritative facts
- semantic retrieval for related knowledge
- relationship traversal for linked decisions and entities
- recency weighting for operational state
- approval-aware filtering for sensitive records

## Indexing and version history
Every durable memory class requires:
- stable identifier
- source citation
- timestamp
- owner
- status
- supersession chain when replaced

## Knowledge refresh policy
- architecture and decision memory refresh on approved changes
- project memory refresh on milestone movement
- risk and debt registers refresh on discovery and retirement
- founder memory refresh only on explicit durable instruction

## Cleanup policy
Short-term and working memory may expire automatically. Decision, repository, and historical memory never disappear silently; they are archived or superseded with traceability.

## Formal repository knowledge model
- architecture memory
- decision memory
- project memory
- risk register
- technical debt register
- improvement backlog
- innovation backlog

## Approval model
Routine indexing is automatic. Sensitive founder memory, business-critical records, and deletion/supersession policy changes require founder approval.

## Operational risks
- stale memory overriding current truth
- duplicated memory without supersession
- weak citation quality
- sensitive data retention beyond policy

## Observability requirements
Track retrieval source mix, stale-memory hits, superseded-record use, refresh latency, archive volume, and memory-policy exceptions.

## Future evolution path
Evolve toward a unified knowledge substrate that supports graph relationships, vector retrieval, audit trails, and policy-aware context assembly.
