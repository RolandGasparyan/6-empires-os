#!/usr/bin/env bash
###############################################################################
# EMPIRE AI — one-paste installer for the new VPS (64.227.6.197)
#
# Installs:  Ollama (local AI models) + EMPIRE AI gold chat app (systemd) + nginx
# Run as root ON THE VPS:
#     bash <(curl -fsSL https://raw.githubusercontent.com/RolandGasparyan/6-empires-os/claude/great-lovelace-aq1yww/empire-ai-chat/INSTALL_ON_VPS.sh)
#   …or scp this file up and:  bash INSTALL_ON_VPS.sh
###############################################################################
set -euo pipefail
GOLD='\033[1;33m'; NC='\033[0m'
say(){ echo -e "${GOLD}▶ $*${NC}"; }

APP_DIR=/opt/empire-ai-chat
PORT=8090
# Pick a model that fits this box's RAM. gemma3:1b is tiny (~1GB) and safe on a
# low-RAM droplet; bump EMPIRE_MODEL to qwen2.5:7b etc. if the box has >=16GB.
MODEL="${EMPIRE_MODEL:-gemma3:1b}"

say "1/7  System packages…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git nginx ca-certificates

say "2/7  Node.js 20 (for the chat server)…"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v

say "3/7  Ollama (local model runtime)…"
if ! command -v ollama >/dev/null 2>&1; then
  curl -fsSL https://ollama.com/install.sh | sh
fi
systemctl enable --now ollama
sleep 3

say "4/7  Pulling model: ${MODEL} (this can take a few minutes)…"
ollama pull "${MODEL}"

say "5/7  Deploying EMPIRE AI chat app…"
mkdir -p "${APP_DIR}"
# fetch the two app files from the repo (raw)
BASE="https://raw.githubusercontent.com/RolandGasparyan/6-empires-os/claude/great-lovelace-aq1yww/empire-ai-chat"
curl -fsSL "${BASE}/server.js"  -o "${APP_DIR}/server.js"
curl -fsSL "${BASE}/index.html" -o "${APP_DIR}/index.html"

cat >/etc/systemd/system/empire-ai.service <<EOF
[Unit]
Description=EMPIRE AI chat
After=network.target ollama.service
Wants=ollama.service

[Service]
Environment=PORT=${PORT}
Environment=OLLAMA_URL=http://127.0.0.1:11434
Environment=EMPIRE_MODEL=${MODEL}
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/node ${APP_DIR}/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now empire-ai
sleep 2

say "6/7  nginx reverse proxy on :80 …"
cat >/etc/nginx/sites-available/empire-ai <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;            # allow token streaming
        proxy_read_timeout 600s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/empire-ai /etc/nginx/sites-enabled/empire-ai
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

say "7/7  Verifying…"
sleep 1
echo "  health: $(curl -s http://127.0.0.1:${PORT}/api/health)"
echo "  http  : $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/)"

echo
say "✅ DONE — EMPIRE AI is live."
echo "   Open:  http://64.227.6.197/"
echo "   Model: ${MODEL}   (change with: EMPIRE_MODEL=qwen2.5:7b bash INSTALL_ON_VPS.sh)"
echo "   Logs:  journalctl -u empire-ai -f   |   ollama list"
