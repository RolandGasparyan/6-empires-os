#!/usr/bin/env bash
set -e
mkdir -p /opt/empire-ai-chat
cp /tmp/server.js /tmp/index.html /tmp/prompts.js /tmp/empire-mark.svg /opt/empire-ai-chat/
command -v node >/dev/null 2>&1 || { curl -fsSL https://deb.nodesource.com/setup_20.x | bash - ; apt-get install -y nodejs ; }

cat >/etc/systemd/system/empire-ai.service <<'EOF'
[Unit]
Description=EMPIRE AI chat
After=network.target
[Service]
Environment=PORT=8090
Environment=OLLAMA_URL=http://127.0.0.1:11434
Environment=EMPIRE_MODEL=nous-hermes2:latest
WorkingDirectory=/opt/empire-ai-chat
ExecStart=/usr/bin/node /opt/empire-ai-chat/server.js
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now empire-ai
sleep 2
echo "===STATUS==="
echo "service: $(systemctl is-active empire-ai)"
echo "node: $(node -v 2>/dev/null)"
echo "localUI: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8090/)"
echo "health: $(curl -s http://127.0.0.1:8090/api/health | head -c 200)"
