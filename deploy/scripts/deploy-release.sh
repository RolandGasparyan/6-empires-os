#!/usr/bin/env bash
set -Eeuo pipefail

EXPECTED_SHA="${1:?usage: deploy-release.sh <verified-commit-sha>}"
COMPOSE_FILE="${COMPOSE_FILE:-config/docker-compose.prod.yml}"
HEALTH_URL="${HEALTH_URL:-https://api.6-empires.com/ready}"
WAIT_TIMEOUT_SECONDS="${WAIT_TIMEOUT_SECONDS:-180}"
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE=(docker compose -f "$COMPOSE_FILE")

case "$EXPECTED_SHA" in
  *[!0-9a-f]*|'') echo "invalid commit SHA: $EXPECTED_SHA" >&2; exit 2 ;;
esac

actual_sha="$(git rev-parse HEAD)"
if [[ "$actual_sha" != "$EXPECTED_SHA" ]]; then
  echo "refusing deploy: HEAD=$actual_sha, expected=$EXPECTED_SHA" >&2
  exit 1
fi

[[ -f "$ENV_FILE" ]] || { echo "required environment file is missing: $ENV_FILE" >&2; exit 1; }
required_env=(POSTGRES_PASSWORD DATABASE_URL NEO4J_PASSWORD JWT_SECRET FOUNDER_BOOTSTRAP_TOKEN)
for key in "${required_env[@]}"; do
  grep -Eq "^${key}=.+" "$ENV_FILE" || {
    echo "required production setting is missing or empty: $key" >&2
    exit 1
  }
done

"${COMPOSE[@]}" config --quiet
"${COMPOSE[@]}" build --pull api web
"${COMPOSE[@]}" up -d --wait --wait-timeout "$WAIT_TIMEOUT_SECONDS" postgres redis
"${COMPOSE[@]}" run --rm --no-deps api alembic upgrade head
"${COMPOSE[@]}" up -d --remove-orphans --wait --wait-timeout "$WAIT_TIMEOUT_SECONDS"

health_body="$(
  curl --fail --silent --show-error \
    --retry 12 --retry-all-errors --retry-delay 10 \
    --connect-timeout 5 --max-time 10 \
    "$HEALTH_URL"
)"
python3 -c 'import json, sys; payload=json.load(sys.stdin); assert payload.get("status") == "ready", payload' <<<"$health_body"

"${COMPOSE[@]}" ps
echo "[deploy] verified $EXPECTED_SHA"
