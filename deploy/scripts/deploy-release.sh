#!/usr/bin/env bash
set -Eeuo pipefail

EXPECTED_SHA="${1:?usage: deploy-release.sh <verified-commit-sha>}"
COMPOSE_FILE="${COMPOSE_FILE:-config/docker-compose.prod.yml}"
HEALTH_URL="${HEALTH_URL:-https://api.6-empires.com/ready}"
WAIT_TIMEOUT_SECONDS="${WAIT_TIMEOUT_SECONDS:-180}"
ENV_FILE="${ENV_FILE:-.env}"
COMPOSE=(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE")

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

# Clear placeholder values for optional tokens (set to empty)
for key in OPENHUMAN_CORE_TOKEN OPENHUMAN_RUNTIME_URL OPENAI_API_KEY OPENHUMAN_CLIENT_ID OPENHUMAN_CLIENT_SECRET; do
  if grep -Eq "^${key}=__CHANGE" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=|" "$ENV_FILE"
    echo "[deploy] cleared placeholder for ${key}"
  fi
done

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

# Source .env to export variables into the shell environment
set -a
source "$ENV_FILE"
set +a

# Stop existing containers to free ports
"${COMPOSE[@]}" down --remove-orphans --volumes=false 2>/dev/null || true
echo "[deploy] stopped compose containers"

# Force remove any lingering containers from previous deploys
# (docker compose down can miss containers from different project names)
OLD_CONTAINERS=$(docker ps -a --format '{{.Names}}' 2>/dev/null | grep -E '^config-' || true)
if [ -n "$OLD_CONTAINERS" ]; then
  echo "[deploy] removing old containers: $OLD_CONTAINERS"
  echo "$OLD_CONTAINERS" | xargs -r docker rm -f 2>/dev/null || true
fi

# Free ports 80/443 from any process (Docker containers or host-level)
echo "[deploy] freeing ports 80/443..."

# 1. Stop all Docker containers that might use these ports
docker stop $(docker ps -q) 2>/dev/null || true
sleep 2

# 2. Kill host processes on port 80/443 using fuser
fuser -k 80/tcp 2>/dev/null || true
fuser -k 443/tcp 2>/dev/null || true
sleep 2

# 3. Kill host processes using lsof
for PORT in 80 443; do
  PIDS=$(lsof -t -i :${PORT} 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "[deploy] killing PIDs on port $PORT: $PIDS"
    echo "$PIDS" | xargs -r kill -9 2>/dev/null || true
  fi
done
sleep 1

# 4. Also try ss as fallback
for PORT in 80 443; do
  PID=$(ss -tlnp 2>/dev/null | grep ":${PORT} " | grep -oP 'pid=\K[0-9]+' | head -1 || true)
  if [ -n "$PID" ]; then
    echo "[deploy] ss: killing PID $PID on port $PORT"
    kill -9 "$PID" 2>/dev/null || true
  fi
done

echo "[deploy] port cleanup complete"

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
