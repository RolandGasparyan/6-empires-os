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

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[deploy] $ENV_FILE not found — bootstrapping from .env.example"
  cp .env.example "$ENV_FILE"
fi

# Auto-generate any missing required secrets
required_env=(POSTGRES_PASSWORD JWT_SECRET FOUNDER_BOOTSTRAP_TOKEN)
for key in "${required_env[@]}"; do
  if ! grep -Eq "^${key}=.+" "$ENV_FILE" || grep -Eq "^${key}=__CHANGE" "$ENV_FILE"; then
    VAL="$(openssl rand -hex 32)"
    if grep -Eq "^${key}=" "$ENV_FILE"; then
      sed -i "s|^${key}=.*|${key}=${VAL}|" "$ENV_FILE"
    else
      echo "${key}=${VAL}" >> "$ENV_FILE"
    fi
    echo "[deploy] generated $key"
  fi
done

# Ensure DATABASE_URL references the generated POSTGRES_PASSWORD
if grep -q "__CHANGE_ME_STRONG__" "$ENV_FILE"; then
  PW=$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" | cut -d= -f2)
  sed -i "s|__CHANGE_ME_STRONG__|$PW|g" "$ENV_FILE"
  echo "[deploy] synced POSTGRES_PASSWORD into DATABASE_URL and NEO4J_PASSWORD"
fi

# Final validation
for key in POSTGRES_PASSWORD DATABASE_URL JWT_SECRET FOUNDER_BOOTSTRAP_TOKEN; do
  grep -Eq "^${key}=.+" "$ENV_FILE" || {
    echo "required production setting is still missing: $key" >&2
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
