#!/usr/bin/env bash
# 6-EMPIRE OS — nightly backup. Run on the VPS (cron: 0 3 * * *).
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="${BACKUP_DIR:-$HOME/empire-backups}"; mkdir -p "$OUT"
COMPOSE="docker compose -f config/docker-compose.prod.yml"

echo "[backup] Postgres dump…"
$COMPOSE exec -T postgres pg_dump -U "${POSTGRES_USER:-empire}" "${POSTGRES_DB:-empires}" | gzip > "$OUT/pg-$STAMP.sql.gz"

echo "[backup] Qdrant + Neo4j volume snapshots…"
# Resolve the actual volume names via Compose's own labels instead of
# assuming a project name — the project name depends on the directory this
# is invoked from (e.g. "6-empires-os", not "config"), so a hardcoded
# prefix silently backs up an empty, unrelated volume instead of erroring.
qdrant_vol="$(docker volume ls --filter label=com.docker.compose.volume=qdrantdata --format '{{.Name}}' | head -1)"
neo4j_vol="$(docker volume ls --filter label=com.docker.compose.volume=neo4jdata --format '{{.Name}}' | head -1)"

if [[ -z "$qdrant_vol" || -z "$neo4j_vol" ]]; then
  echo "[backup] ERROR: could not resolve qdrant/neo4j volumes (qdrant='$qdrant_vol' neo4j='$neo4j_vol')" >&2
  exit 1
fi

docker run --rm -v "$qdrant_vol":/data -v "$OUT":/backup alpine tar czf "/backup/qdrant-$STAMP.tar.gz" -C /data .
docker run --rm -v "$neo4j_vol":/data  -v "$OUT":/backup alpine tar czf "/backup/neo4j-$STAMP.tar.gz"  -C /data .

echo "[backup] pruning backups older than 14 days…"
find "$OUT" -type f -mtime +14 -delete
echo "[backup] done → $OUT"
