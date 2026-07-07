# Production Readiness Checklist

## Purpose
Provide the single completion gate for initiatives before release, promotion, or founder acceptance.

## Ownership
Platform, QA, security, and architecture leadership own readiness evidence; founder owns final release approval.

## Inputs and outputs
**Inputs:** implementation artifacts, test results, architecture review, security findings, deployment plan, monitoring setup, rollback instructions.  
**Outputs:** release recommendation, blocked-release reasons, approved readiness record, future-improvement actions.

## Dependencies
- `docs/architecture/MASTER-ARCHITECTURE.md`
- `docs/roadmap/ENTERPRISE-ROADMAP.md`
- `docs/PRODUCTION-HANDOFF.md`

## Approval model
Teams may prepare evidence automatically. Production approval requires explicit founder acceptance when a release changes live behavior or operating risk.

## Readiness gate
| Area | Required evidence |
|---|---|
| Implementation | Scope delivered and traceable to approved objective |
| Tests | Existing automated/manual validation completed and results recorded |
| Documentation | User, operator, and architecture docs updated |
| Architecture alignment | Change fits approved boundaries or approved exception exists |
| Security review | Secrets, auth, dependencies, and abuse risks reviewed |
| Performance review | Expected load, latency, or resource impact assessed |
| Deployment readiness | Environments, artifacts, and runbook confirmed |
| Monitoring | Metrics, logs, alerts, and ownership defined |
| Rollback strategy | Reversal path documented and tested where applicable |
| Risk assessment | Open risks recorded with severity and owner |
| Future improvements | Next-step recommendations captured |

## Operational overlays
### Enterprise observability
Every production candidate must define:
- metrics
- logs
- traces
- dashboards
- alerts
- error tracking
- performance analytics
- infrastructure health
- AI health
- business KPIs

### Security operations center discipline
Every production candidate must address:
- threat detection
- secrets management
- access control and RBAC
- audit logs
- vulnerability and dependency scanning
- incident response ownership

### Disaster recovery
Every production candidate must confirm:
- daily backup policy
- weekly snapshot policy
- rollback plan
- infrastructure recovery path
- database recovery path
- knowledge recovery path
- business continuity owner

## Operational risks
- declaring readiness without evidence
- monitoring gaps hidden behind successful build output
- missing rollback ownership
- security or DR work treated as optional

## Observability requirements
Track readiness status by gate, blocked releases, missing evidence, rollback drill status, unresolved risks, and alert ownership coverage.

## Future evolution path
Promote this checklist into a machine-readable release gate enforced by CI/CD and surfaced in the founder console.
