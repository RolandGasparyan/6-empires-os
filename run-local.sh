#!/usr/bin/env bash
# ============================================================================
# 6-EMPIRE OS — ONE-COMMAND LOCAL LAUNCH
# Usage:  bash run-local.sh
# Brings up the full stack on your Mac via Docker. No VPS/SSL needed.
#   Web  -> http://localhost:3000        (3D OS + Founder dashboard)
#   API  -> http://localhost:8000/docs   (Swagger)
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"
COMPOSE="docker compose -f config/docker-compose.local.yml"

echo "==> [1/6] Checking Docker…"
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker not found. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"; exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is installed but not running. Open Docker Desktop, wait for it to start, then re-run."; exit 1
fi
echo "    Docker OK."

echo "==> [2/6] Generating local secrets (.env.local-run)…"
if [ ! -f .env.local-run ]; then
  JWT=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p | tr -d '\n')
  cat > .env.local-run <<ENV
POSTGRES_USER=empire
POSTGRES_PASSWORD=empire_local
POSTGRES_DB=empires
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j_local
JWT_SECRET=${JWT}
FOUNDER_EMAIL=roland.gasparyan@gmail.com
ENV
  echo "    Created .env.local-run with a fresh JWT secret."
else
  echo "    Reusing existing .env.local-run."
fi
set -a; . ./.env.local-run; set +a

echo "==> [3/6] Building images (first run pulls + builds; can take a few minutes)…"
$COMPOSE build

echo "==> [4/6] Starting the stack…"
$COMPOSE up -d

echo "==> [5/6] Waiting for API health (up to 90s)…"
ok=0
for i in $(seq 1 45); do
  if curl -fsS -m 2 http://localhost:8000/health >/dev/null 2>&1; then ok=1; break; fi
  sleep 2
done
if [ "$ok" = 1 ]; then echo "    API healthy ✓"; else
  echo "    API not healthy yet. Check: $COMPOSE logs api"; fi

echo "==> [6/6] Registering the Founder account…"
RESP=$(curl -fsS -m 5 -X POST http://localhost:8000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${FOUNDER_EMAIL}\",\"username\":\"founder\",\"password\":\"EmpireFounder!2026\"}" 2>/dev/null || echo '{"note":"already registered or API booting"}')
echo "    $RESP"

cat <<DONE

============================================================
  6-EMPIRE OS is LIVE locally 🚀
------------------------------------------------------------
  3D Command Center : http://localhost:3000
  Founder Login     : http://localhost:3000/founder/login
  API / Swagger     : http://localhost:8000/docs
  API Health        : http://localhost:8000/health

  Founder credentials (CHANGE THIS PASSWORD):
    email    : ${FOUNDER_EMAIL}
    password : EmpireFounder!2026

  Manage:
    Logs   : $COMPOSE logs -f
    Stop   : $COMPOSE down
    Status : $COMPOSE ps
============================================================
DONE
