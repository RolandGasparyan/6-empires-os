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

# Bootstrap .env from template if missing
if [[ ! -f "$ENV_FILE" ]]; then
  echo "[deploy] $ENV_FILE not found — bootstrapping from .env.example"
  cp .env.example "$ENV_FILE"
fi

# Generate or replace any secret that is missing, empty, or still a placeholder
generate_secret() {
  local key="$1" val
  val="$(openssl rand -hex 32)"
  if grep -Eq "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
  echo "[deploy] generated ${key}"
}

needs_gen() {
  local key="$1"
  # Returns 0 (true) if the key needs to be generated
  if ! grep -Eq "^${key}=.+" "$ENV_FILE"; then
    return 0  # missing entirely
  fi
  if grep -Eq "^${key}=__CHANGE" "$ENV_FILE"; then
    return 0  # placeholder value
  fi
  if grep -Eq "^${key}=$" "$ENV_FILE"; then
    return 0  # empty value
  fi
  return 1  # has a valid value
}

for key in POSTGRES_PASSWORD JWT_SECRET FOUNDER_BOOTSTRAP_TOKEN; do
  if needs_gen "$key"; then
    generate_secret "$key"
  fi
done

# Sync POSTGRES_PASSWORD into DATABASE_URL and NEO4J_PASSWORD if they still have placeholders
PW=$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)
if grep -q "__CHANGE_ME_STRONG__" "$ENV_FILE"; then
  sed -i "s|__CHANGE_ME_STRONG__|${PW}|g" "$ENV_FILE"
  echo "[deploy] synced POSTGRES_PASSWORD into DATABASE_URL and NEO4J_PASSWORD"
fi

# Also sync JWT_SECRET if it has a placeholder
if grep -q "__CHANGE_ME_64_HEX__" "$ENV_FILE"; then
  JWT=$(grep '^JWT_SECRET=' "$ENV_FILE" | cut -d= -f2-)
  sed -i "s|__CHANGE_ME_64_HEX__|${JWT}|g" "$ENV_FILE"
  echo "[deploy] synced JWT_SECRET placeholder"
fi

# Print .env keys for debugging (values redacted)
echo "[deploy] .env keys present:"
grep -E '^[A-Z_]+=' "$ENV_FILE" | sed 's/=.*/=<redacted>/' || true

# Final validation
for key in POSTGRES_PASSWORD DATABASE_URL JWT_SECRET FOUNDER_BOOTSTRAP_TOKEN; do
  if ! grep -Eq "^${key}=[^[:space:]]+" "$ENV_FILE"; then
    echo "required production setting is still missing or empty: $key" >&2
    exit 1
  fi
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
