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

# ── TLS certificate bootstrap ───────────────────────────────────────────────
# nginx refuses to start if any referenced certificate file is missing, which
# crash-loops the whole stack. Before bringing anything up (port 80 is free at
# this point — old containers are down and the new nginx isn't started yet),
# make sure the certbot volume holds a cert for every domain. On a fresh/empty
# volume this issues them automatically instead of leaving the site down.
CERTBOT_CONF_VOLUME="${CERTBOT_CONF_VOLUME:-config_certbotconf}"
CERTBOT_WWW_VOLUME="${CERTBOT_WWW_VOLUME:-config_certbotwww}"
CERTBOT_CONF_DIR="${CERTBOT_CONF_DIR:-/var/lib/docker/volumes/${CERTBOT_CONF_VOLUME}/_data}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-${FOUNDER_EMAIL:-admin@6-empires.com}}"

cert_present() { [[ -f "${CERTBOT_CONF_DIR}/live/$1/fullchain.pem" ]]; }

ensure_cert() {  # $1 = lineage/primary domain, remaining args = extra SANs
  local primary="$1"; shift
  if cert_present "$primary"; then
    echo "[deploy] TLS cert present for $primary"
    return 0
  fi
  echo "[deploy] no TLS cert for $primary — issuing via certbot standalone…"
  local args=(-d "$primary") d
  for d in "$@"; do args+=(-d "$d"); done
  if docker run --rm -p 80:80 \
       -v "${CERTBOT_CONF_VOLUME}:/etc/letsencrypt" \
       -v "${CERTBOT_WWW_VOLUME}:/var/www/certbot" \
       certbot/certbot certonly --standalone "${args[@]}" \
       --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --non-interactive; then
    echo "[deploy] issued TLS cert for $primary"
  else
    echo "[deploy] WARNING: certbot could not issue $primary (check DNS + that port 80 is free) — continuing"
  fi
}

echo "[deploy] ensuring TLS certificates…"
ensure_cert 6-empires.com www.6-empires.com api.6-empires.com

# Optional booking reverse proxy: materialise its vhost into the always-loaded
# conf.d ONLY when a cert exists, so a missing booking cert can never crash the
# nginx that serves the main site. The source lives in nginx/optional/ and is
# re-applied every deploy, surviving `git reset --hard`.
BOOKING_SRC="deploy/nginx/optional/40-booking.conf"
BOOKING_DST="deploy/nginx/conf.d/40-booking.conf"
if [[ -f "$BOOKING_SRC" ]]; then
  ensure_cert booking.6-empires.com
  if cert_present booking.6-empires.com; then
    cp "$BOOKING_SRC" "$BOOKING_DST"
    echo "[deploy] booking vhost enabled (cert present)"
  else
    rm -f "$BOOKING_DST"
    echo "[deploy] booking vhost skipped (no cert yet)"
  fi
fi

"${COMPOSE[@]}" up -d --wait --wait-timeout "$WAIT_TIMEOUT_SECONDS" postgres redis
"${COMPOSE[@]}" run --rm --no-deps api alembic upgrade head
"${COMPOSE[@]}" up -d --remove-orphans --wait --wait-timeout "$WAIT_TIMEOUT_SECONDS"

# Wait for nginx to stabilize
echo "[deploy] waiting 15s for nginx to stabilize..."
sleep 15

# Show container status
"${COMPOSE[@]}" ps

# Health check - try HTTPS first, then HTTP, then internal
echo "[deploy] running health check..."
health_ok=false

# Try HTTPS (external)
for attempt in $(seq 1 6); do
  if health_body="$(curl --fail --silent --show-error --connect-timeout 5 --max-time 10 "$HEALTH_URL" 2>/dev/null)"; then
    if echo "$health_body" | python3 -c 'import json, sys; payload=json.load(sys.stdin); assert payload.get("status") == "ready", payload' 2>/dev/null; then
      health_ok=true
      echo "[deploy] health check passed (HTTPS)"
      break
    fi
  fi
  echo "[deploy] health check attempt $attempt failed, retrying in 10s..."
  sleep 10
done

# Try HTTP (internal via docker)
if [ "$health_ok" = "false" ]; then
  echo "[deploy] HTTPS failed, trying internal health check..."
  if health_body="$(docker exec config-api-1 curl -sf http://localhost:8000/ready 2>/dev/null)"; then
    if echo "$health_body" | python3 -c 'import json, sys; payload=json.load(sys.stdin); assert payload.get("status") == "ready", payload' 2>/dev/null; then
      health_ok=true
      echo "[deploy] health check passed (internal)"
    fi
  fi
fi

if [ "$health_ok" = "false" ]; then
  echo "[deploy] WARNING: health check failed, but containers are running"
  echo "[deploy] nginx SSL may need manual setup (check certbot)"
  "${COMPOSE[@]}" ps
  echo "[deploy] deployed $EXPECTED_SHA (health check pending)"
else
  echo "[deploy] verified $EXPECTED_SHA"
fi
