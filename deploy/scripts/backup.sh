#!/usr/bin/env bash
# 6-EMPIRE OS — nightly backup. Run on the VPS (cron: 0 3 * * *).
set -Eeuo pipefail

STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR:-$HOME/empire-backups}"
COMPOSE_FILE="${COMPOSE_FILE:-config/docker-compose.prod.yml}"
SYNC_STATE_DIR="${SYNC_STATE_DIR:-/opt/empire-sync}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
COMPOSE=(docker compose -f "$COMPOSE_FILE")
mkdir -p "$OUT"

tmp_files=()
cleanup() {
  if ((${#tmp_files[@]})); then
    rm -f -- "${tmp_files[@]}"
  fi
}
trap cleanup EXIT

volume_for() {
  local service="$1" destination="$2" container volume
  container="$("${COMPOSE[@]}" ps -q "$service")"
  [[ -n "$container" ]] || { echo "[backup] $service container is not running" >&2; return 1; }
  volume="$(docker inspect --format "{{range .Mounts}}{{if eq .Destination \"$destination\"}}{{.Name}}{{end}}{{end}}" "$container")"
  [[ -n "$volume" ]] || { echo "[backup] no named volume mounted at $service:$destination" >&2; return 1; }
  printf '%s\n' "$volume"
}

snapshot_volume() {
  local service="$1" destination="$2" volume archive tmp
  volume="$(volume_for "$service" "$destination")"
  archive="$OUT/$service-$STAMP.tar.gz"
  tmp="$OUT/.$service-$STAMP.tar.gz.tmp"
  tmp_files+=("$tmp")
  docker run --rm -v "$volume:/data:ro" -v "$OUT:/backup" alpine:3.20 \
    tar czf "/backup/.$service-$STAMP.tar.gz.tmp" -C /data .
  tar -tzf "$tmp" >/dev/null
  mv "$tmp" "$archive"
}

echo "[backup] PostgreSQL logical dump"
pg_archive="$OUT/postgres-$STAMP.sql.gz"
pg_tmp="$OUT/.postgres-$STAMP.sql.gz.tmp"
tmp_files+=("$pg_tmp")
"${COMPOSE[@]}" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-empire}" "${POSTGRES_DB:-empires}" | gzip -c >"$pg_tmp"
gzip -t "$pg_tmp"
mv "$pg_tmp" "$pg_archive"

echo "[backup] Redis persistence checkpoint"
"${COMPOSE[@]}" exec -T redis redis-cli SAVE >/dev/null
snapshot_volume redis /data

echo "[backup] Qdrant and Neo4j named-volume snapshots"
snapshot_volume qdrant /qdrant/storage
snapshot_volume neo4j /data

sync_files=()
for name in brain.json state.json agents-state.json; do
  [[ -f "$SYNC_STATE_DIR/$name" ]] && sync_files+=("$name")
done
if ((${#sync_files[@]})); then
  sync_archive="$OUT/empire-sync-$STAMP.tar.gz"
  sync_tmp="$OUT/.empire-sync-$STAMP.tar.gz.tmp"
  tmp_files+=("$sync_tmp")
  tar -C "$SYNC_STATE_DIR" -czf "$sync_tmp" -- "${sync_files[@]}"
  tar -tzf "$sync_tmp" >/dev/null
  mv "$sync_tmp" "$sync_archive"
else
  echo "[backup] WARNING: no empire-sync state files found in $SYNC_STATE_DIR" >&2
fi

manifest="$OUT/manifest-$STAMP.sha256"
find "$OUT" -maxdepth 1 -type f -name "*-$STAMP.*" ! -name "manifest-*" -print0 \
  | sort -z \
  | xargs -0 sha256sum >"$manifest"
{
  printf '# created_at=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '# git_commit=%s\n' "$(git rev-parse HEAD 2>/dev/null || printf unknown)"
  printf '# compose_file=%s\n' "$COMPOSE_FILE"
  printf '# sync_state_files=%s\n' "${sync_files[*]:-none}"
} >>"$manifest"

echo "[backup] pruning files older than $RETENTION_DAYS days"
find "$OUT" -type f -mtime "+$RETENTION_DAYS" -delete
echo "[backup] verified backup set $STAMP in $OUT"
