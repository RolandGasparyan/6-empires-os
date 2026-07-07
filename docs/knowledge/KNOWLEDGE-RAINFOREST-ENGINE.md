# Knowledge Rainforest Engine

## Purpose
Define the knowledge substrate that connects ideas, documents, meetings, projects, code, research, business context, media, trading, founder notes, external sources, and learning history.

## Ownership
Knowledge engineering owns structure and retrieval quality. Architecture owns technical integration. Founder owns strategic relevance.

## Inputs and outputs
**Inputs:** repository docs, source code, research artifacts, operational events, founder notes, external references.  
**Outputs:** searchable knowledge nodes, relationship graph edges, summaries, tags, clusters, indexes, retrieval-ready context.

## Dependencies
- `docs/governance/AI-MEMORY-ARCHITECTURE.md`
- `docs/architecture/MASTER-ARCHITECTURE.md`
- `docs/founder/FOUNDER-INTELLIGENCE-CONSOLE.md`

## Knowledge domains
Ideas → Documents → Meetings → Projects → Code → Research → Business → Media → Trading → Founder Notes → External Sources → Learning History

## Core capabilities
- semantic search
- vector retrieval
- relationship graph traversal
- automatic summaries
- automatic tagging
- automatic clustering
- automatic indexing

## Node model
Each node must define source, owner, freshness, confidence, related entities, and access policy.

## Relationship model
Relationships should capture dependency, supersession, evidence, impact, ownership, and temporal sequence.

## Approval model
Ingestion and indexing may be automatic for approved sources. New source classes, external data policies, and strategic synthesis outputs require founder-approved governance.

## Operational risks
- low-quality ingestion polluting retrieval
- source ambiguity causing false authority
- stale summaries masking new facts
- over-connected graph without confidence controls

## Observability requirements
Track ingestion volume, retrieval quality, summary freshness, orphan nodes, graph density, source confidence, and failed enrichments.

## Future evolution path
Unify graph, vector, and document pipelines into a single policy-aware knowledge platform that powers planning, architecture, and founder decision support.
