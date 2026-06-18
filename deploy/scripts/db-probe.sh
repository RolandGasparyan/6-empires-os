#!/usr/bin/env bash
# Probe each datastore. Run on the VPS.
set -u
echo "Postgres:"; docker compose -f config/docker-compose.prod.yml exec -T postgres pg_isready -U "${POSTGRES_USER:-empire}" || echo "  DOWN"
echo "Redis:";    docker compose -f config/docker-compose.prod.yml exec -T redis redis-cli ping || echo "  DOWN"
echo "Qdrant:";   curl -s --max-time 5 http://localhost:6333/healthz || echo "  DOWN"; echo
echo "Neo4j:";    docker compose -f config/docker-compose.prod.yml exec -T neo4j cypher-shell -u "${NEO4J_USER:-neo4j}" -p "${NEO4J_PASSWORD}" "RETURN 1;" 2>/dev/null || echo "  check creds"
