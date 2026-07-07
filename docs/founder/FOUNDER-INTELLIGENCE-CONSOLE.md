# Founder Intelligence Console

## Purpose
Define the founder’s primary dashboard for companies, startups, agents, deployments, knowledge, research, revenue, tasks, calendar, risks, and opportunities.

## Ownership
Founder owns product direction. Product, platform, and data leadership own implementation and operational fidelity.

## Inputs and outputs
**Inputs:** platform telemetry, business metrics, roadmap state, AI activity, deployment state, risk and opportunity registers.
**Outputs:** executive dashboards, alerts, approval actions, drill-down workflows, strategic summaries.

## Dependencies
- `docs/architecture/MASTER-ARCHITECTURE.md`
- `docs/roadmap/ENTERPRISE-ROADMAP.md`
- `docs/knowledge/KNOWLEDGE-RAINFOREST-ENGINE.md`

## Core surface areas
- all companies
- all startups
- all AI agents
- all deployments
- GitHub and engineering state
- knowledge and research systems
- trading and business signals
- KPIs, revenue, tasks, calendar, notifications, risks, opportunities

## Design contract
The console must unify operational truth, strategic visibility, and approval controls without fragmenting context across tools.

## Approval model
Read access and passive analytics are continuous. Approval actions inside the console must enforce the founder-gated rules defined in governance.

## Operational risks
- noisy dashboards hiding critical signals
- approval actions without sufficient evidence
- fragmented data models across engineering and business systems

## Observability requirements
Track alert quality, approval latency, dashboard freshness, missing data sources, executive workflow completion, and false-positive notification rates.

## Future evolution path
Evolve into the single control plane for operating, approving, and learning across the full 6-EMPIRE ecosystem.
