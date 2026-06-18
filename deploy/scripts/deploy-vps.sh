#!/usr/bin/env bash
# =============================================================================
# 6-EMPIRE OS — One-shot VPS deploy for 6-empires.com
# =============================================================================
# Run this ON THE VPS (Ubuntu 22/24), as a user with docker access, after:
#   1. DNS A-records point 6-empires.com, www, api  ->  this VPS IP
#   2. Ports 80 + 443 are open in the firewall
#
# It is idempotent: safe to re-run. It will NOT overwrite an existing .env.
#
# Usage:
#   chmod +x deploy/scripts/deploy-vps.sh
#   ./deploy/scripts/deploy-vps.sh
# =============================================================================
set -euo pipefail

DOMAIN="6-empires.com"
EMAIL="${CERTBOT_EMAIL:-roland.gasparyan@gmail.com}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE="docker compose -f config/docker-compose.prod.yml"
cd "$REPO_DIR"

say(){ printf '\n\033[1;33m=== %s ===\033[0m\n' "$*"; }

# ---------------------------------------------------------------------------
say "0. Preflight: docker + DNS"
docker --version >/dev/null || { echo "Docker not installed"; exit 1; }
docker compose version >/dev/null || { echo "docker compose v2 required"; exit 1; }
SERVER_IP="$(curl -fsS https://api.ipify.org || echo '?')"
echo "This server's public IP: $SERVER_IP"
for h in "$DOMAIN" "www.$DOMAIN" "api.$DOMAIN"; do
  RESOLVED="$(getent hosts "$h" | awk '{print $1}' | head -1 || true)"
  echo "  $h -> ${RESOLVED:-(unresolved)}"
done
echo "If any host above is unresolved or != $SERVER_IP, fix DNS before continuing."

# ---------------------------------------------------------------------------
say "1. Secrets (.env) — created once, never overwritten"
if [ ! -f .env ]; then
  cat > .env <<EOF
ENV=production
APP_NAME=6-EMPIRE OS API
# --- generated secrets ---
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=12
REFRESH_EXPIRE_DAYS=30
FOUNDER_EMAIL=$EMAIL
# --- datastores ---
POSTGRES_USER=empire
POSTGRES_PASSWORD=$(openssl rand -hex 24)
POSTGRES_DB=empires
DATABASE_URL=postgresql+asyncpg://empire:__FILLED_BELOW__@postgres:5432/empires
REDIS_URL=redis://redis:6379/0
QDRANT_URL=http://qdrant:6333
NEO4J_USER=neo4j
NEO4J_PASSWORD=$(openssl rand -hex 24)
NEO4J_URI=neo4j://neo4j:7687
# --- cors (HTTPS origins only) ---
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
# --- optional: real LLM brain (leave blank for deterministic fallback) ---
OPENAI_API_KEY=
EOF
  # stitch the generated postgres password into DATABASE_URL
  PGPW="$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)"
  sed -i "s|__FILLED_BELOW__|$PGPW|" .env
  echo ".env created with fresh secrets."
else
  echo ".env already exists — leaving it untouched."
fi

# ---------------------------------------------------------------------------
say "2. Build images (api + web). Web bakes in HTTPS api host via build args."
$COMPOSE build api web

# ---------------------------------------------------------------------------
say "3. Bring up datastores + api + web (no nginx yet)"
$COMPOSE up -d postgres redis qdrant neo4j api web

# ---------------------------------------------------------------------------
say "4. SSL bootstrap — HTTP-only nginx so certbot can solve the ACME challenge"
# Temporarily serve ONLY the port-80 redirect/challenge config so nginx can
# start without the certs it doesn't have yet.
mkdir -p deploy/nginx/_bootstrap
cp deploy/nginx/conf.d/00-redirect.conf deploy/nginx/_bootstrap/ 2>/dev/null || true
# Run a throwaway nginx that only serves the ACME webroot on :80.
docker rm -f empire-acme >/dev/null 2>&1 || true
docker run -d --name empire-acme --network config_empire -p 80:80 \
  -v "$PWD/deploy/nginx/_bootstrap:/etc/nginx/conf.d:ro" \
  -v empire-certbotwww:/var/www/certbot \
  nginx:1.27-alpine
sleep 3

say "5. Issue Let's Encrypt certificate for $DOMAIN, www, api"
docker run --rm \
  -v empire-certbotconf:/etc/letsencrypt \
  -v empire-certbotwww:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" -d "api.$DOMAIN" \
  --email "$EMAIL" --agree-tos --no-eff-email --non-interactive

docker rm -f empire-acme >/dev/null 2>&1 || true

# ---------------------------------------------------------------------------
say "6. Start the full production stack (nginx now has certs, HTTPS live)"
$COMPOSE up -d
sleep 8

# ---------------------------------------------------------------------------
say "7. Verify"
$COMPOSE ps
echo "--- API health (through HTTPS) ---"
curl -fsS "https://api.$DOMAIN/health" || echo "(api health not ready — check 'docker compose -f config/docker-compose.prod.yml logs api')"
echo
echo "--- Web (through HTTPS) ---"
curl -s -o /dev/null -w "https://$DOMAIN/hq -> HTTP %{http_code}\n" "https://$DOMAIN/hq"

say "DONE"
cat <<EOF

  6-EMPIRE OS is deployed.
    Web      https://$DOMAIN/hq   /console   /chat
    API      https://api.$DOMAIN/docs   /health
    Founder  https://$DOMAIN/founder/login   (register $EMAIL — auto-elevated to founder)

  Certbot auto-renews via the 'certbot' service in the compose file.
  Backups: schedule deploy/scripts/backup.sh via cron.
EOF
