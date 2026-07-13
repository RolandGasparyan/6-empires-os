#!/usr/bin/env bash
# Restore one production named volume from a backup created by backup.sh.
set -Eeuo pipefail

SERVICE="${1:?usage: RESTORE_CONFIRM=restore-SERVICE restore-volume.sh SERVICE ARCHIVE}"
ARCHIVE="${2:?usage: RESTORE_CONFIRM=restore-SERVICE restore-volume.sh SERVICE ARCHIVE}"
COMPOSE_FILE="${COMPOSE_FILE:-config/docker-compose.prod.yml}"
COMPOSE=(docker compose -f "$COMPOSE_FILE")

case "$SERVICE" in
  redis) destination=/data ;;
  qdrant) destination=/qdrant/storage ;;
  neo4j) destination=/data ;;
  *) echo "unsupported service: $SERVICE" >&2; exit 2 ;;
esac

[[ "${RESTORE_CONFIRM:-}" == "restore-$SERVICE" ]] || {
  echo "refusing destructive restore; set RESTORE_CONFIRM=restore-$SERVICE" >&2
  exit 2
}
[[ -f "$ARCHIVE" ]] || { echo "archive not found: $ARCHIVE" >&2; exit 2; }
tar -tzf "$ARCHIVE" >/dev/null

container="$("${COMPOSE[@]}" ps -q "$SERVICE")"
[[ -n "$container" ]] || { echo "$SERVICE container is not running" >&2; exit 1; }
volume="$(docker inspect --format "{{range .Mounts}}{{if eq .Destination \"$destination\"}}{{.Name}}{{end}}{{end}}" "$container")"
[[ -n "$volume" ]] || { echo "could not resolve $SERVICE volume" >&2; exit 1; }

archive_dir="$(cd "$(dirname "$ARCHIVE")" && pwd)"
archive_name="$(basename "$ARCHIVE")"
restart_service=true
trap 'if $restart_service; then "${COMPOSE[@]}" start "$SERVICE" >/dev/null; fi' EXIT

"${COMPOSE[@]}" stop "$SERVICE"
docker run --rm -v "$volume:/data" -v "$archive_dir:/backup:ro" alpine:3.20 \
  sh -ceu 'find /data -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +; tar xzf "/backup/$1" -C /data' -- "$archive_name"
"${COMPOSE[@]}" start "$SERVICE"
restart_service=false
echo "restored $SERVICE from $ARCHIVE into volume $volume"
