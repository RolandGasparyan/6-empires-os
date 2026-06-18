#!/usr/bin/env bash
# 6-EMPIRE OS — nightly backup. Run on the VPS (cron: 0 3 * * *).
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="${BACKUP_DIR:-$HOME/empire-backups}"; mkdir -p "$OUT"
COMPOSE="docker compose -f config/docker-compose.prod.yml"

echo "[backup] Postgres dump…"
$COMPOSE exec -T postgres pg_dump -U "${POSTGRES_USER:-empire}" "${POSTGRES_DB:-empires}" | gzip > "$OUT/pg-$STAMP.sql.gz"

echo "[backup] Qdrant + Neo4j volume snapshots…"
docker run --rm -v config_qdrantdata:/data -v "$OUT":/backup alpine tar czf "/backup/qdrant-$STAMP.tar.gz" -C /data .
docker run --rm -v config_neo4jdata:/data  -v "$OUT":/backup alpine tar czf "/backup/neo4j-$STAMP.tar.gz"  -C /data .

echo "[backup] pruning backups older than 14 days…"
find "$OUT" -type f -mtime +14 -delete
echo "[backup] done → $OUT"
