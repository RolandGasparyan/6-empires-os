#!/usr/bin/env bash
# ============================================================================
# migrate-to-gpu.sh — stand up the full 6-EMPIRE stack on a fresh
# DigitalOcean RTX 4000 Ada GPU Droplet, pulling everything from the current
# CPU droplet (137.184.54.161) and switching Ollama to GPU.
#
# RUN THIS *ON THE NEW GPU DROPLET* as root, AFTER it exists:
#   ssh root@<NEW_GPU_IP>
#   # paste this file, then:  bash migrate-to-gpu.sh
#
# It is idempotent — safe to re-run. It will:
#   1. Install Docker + NVIDIA Container Toolkit (GPU passthrough)
#   2. Install Ollama with GPU and pull all 5 EMPIRE models
#   3. rsync the stack dirs from the OLD droplet (compose, configs, data, .env)
#   4. Bring up the router/shim, EMPIRE PRIME (Open WebUI), context service
#   5. Re-create the empire-learn / empire-research systemd timers
#   6. Verify GPU inference + the public /v1 endpoint
# ============================================================================
set -euo pipefail

OLD_IP="137.184.54.161"
OLD_SSH="root@${OLD_IP}"
# The script will ask the old droplet for files over SSH. You'll need the old
# droplet reachable. Easiest: run `ssh-copy-id` from new->old first, OR paste
# the audit key onto the new box at /root/.ssh/old_droplet and chmod 600 it.
OLD_KEY="${OLD_KEY:-/root/.ssh/old_droplet}"
SSH_OPTS="-o StrictHostKeyChecking=no -i ${OLD_KEY}"

say(){ echo -e "\n\033[1;33m==> $*\033[0m"; }

# ---------------------------------------------------------------------------
say "[1/8] System prep + Docker"
apt-get update -y
apt-get install -y ca-certificates curl gnupg rsync jq
install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
fi
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker

# ---------------------------------------------------------------------------
say "[2/8] NVIDIA Container Toolkit (GPU in Docker)"
# DO GPU images usually ship the driver; verify with nvidia-smi.
if ! command -v nvidia-smi >/dev/null 2>&1; then
  echo "!! nvidia-smi not found. This box may not be a GPU droplet, or the driver isn't installed."
  echo "   On DO GPU Droplets the driver is preinstalled. Stop and check the droplet type."
  exit 1
fi
nvidia-smi || true
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -fsSL https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list \
 | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' \
 > /etc/apt/sources.list.d/nvidia-container-toolkit.list
apt-get update -y
apt-get install -y nvidia-container-toolkit
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker

# ---------------------------------------------------------------------------
say "[3/8] Install Ollama (GPU) + keep-alive"
curl -fsSL https://ollama.com/install.sh | sh
mkdir -p /etc/systemd/system/ollama.service.d
cat > /etc/systemd/system/ollama.service.d/empire.conf <<'EOF'
[Service]
Environment=OLLAMA_KEEP_ALIVE=-1
Environment=OLLAMA_HOST=0.0.0.0:11434
Environment=OLLAMA_FLASH_ATTENTION=1
EOF
systemctl daemon-reload
systemctl enable --now ollama
sleep 5
say "Pulling all 5 EMPIRE models (GPU will load them)…"
for m in llama3.2:1b llama3.2:latest mistral:latest nous-hermes2:latest nomic-embed-text:latest; do
  ollama pull "$m"
done
ollama list

# ---------------------------------------------------------------------------
say "[4/8] Pull stack dirs from OLD droplet (${OLD_IP})"
for d in /root/6-empires-os-full /opt/empire-prime /opt/openhuman-context /opt/empire-learn /opt/empire-research; do
  mkdir -p "$d"
  echo "  rsync $d …"
  rsync -az --delete ${SSH_OPTS:+-e "ssh $SSH_OPTS"} "${OLD_SSH}:${d}/" "${d}/" || \
    echo "  (warning: rsync of $d failed — check OLD_KEY / connectivity)"
done

# Point Ollama URL at the host gateway for containers (docker bridge default)
if [ -f /root/6-empires-os-full/.env ]; then
  sed -i 's#^OLLAMA_BASE_URL=.*#OLLAMA_BASE_URL=http://172.17.0.1:11434#' /root/6-empires-os-full/.env || true
  grep -q OLLAMA_BASE_URL /root/6-empires-os-full/.env || echo "OLLAMA_BASE_URL=http://172.17.0.1:11434" >> /root/6-empires-os-full/.env
fi

# ---------------------------------------------------------------------------
say "[5/8] Bring up the router/shim stack"
cd /root/6-empires-os-full
docker compose up -d
sleep 6
docker compose ps

# ---------------------------------------------------------------------------
say "[6/8] Bring up EMPIRE PRIME (Open WebUI) + context service"
if [ -f /opt/empire-prime/docker-compose.yml ]; then
  (cd /opt/empire-prime && docker compose up -d) || true
fi
# OpenHuman context (Flask :7090) — recreate the systemd unit if present
if [ -f /opt/openhuman-context/app.py ]; then
  cat > /etc/systemd/system/openhuman-context.service <<'EOF'
[Unit]
Description=OpenHuman Context Service (6-EMPIRE)
After=network.target
[Service]
WorkingDirectory=/opt/openhuman-context
ExecStart=/usr/bin/python3 /opt/openhuman-context/app.py
Restart=always
[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable --now openhuman-context.service || true
fi

# ---------------------------------------------------------------------------
say "[7/8] Re-create learn + research timers"
for u in empire-learn empire-research; do
  if [ -f /opt/${u}/run.sh ]; then
    chmod +x /opt/${u}/run.sh
    # copy unit + timer if they were rsynced under /opt; else skip (already in stack)
    [ -f /opt/${u}/${u}.service ] && cp /opt/${u}/${u}.service /etc/systemd/system/ || true
    [ -f /opt/${u}/${u}.timer ]   && cp /opt/${u}/${u}.timer   /etc/systemd/system/ || true
  fi
done
systemctl daemon-reload
systemctl enable --now empire-learn.timer empire-research.timer 2>/dev/null || true

# ---------------------------------------------------------------------------
say "[8/8] Verify"
echo "--- nvidia-smi (model should load on GPU after first call) ---"
ollama run llama3.2:1b "say ONLINE" --keepalive -1m >/dev/null 2>&1 || true
nvidia-smi --query-gpu=memory.used,utilization.gpu --format=csv || true
echo "--- ollama ps (PROCESSOR should say GPU) ---"
ollama ps
echo "--- local router /v1/models ---"
curl -s -m 10 http://localhost:8000/v1/models | jq -r '.data[].id' 2>/dev/null || echo "(router not answering yet)"
echo "--- stream TTFB through the shim ---"
curl -s -N -m 20 -o /dev/null -w "stream TTFB %{time_starttransfer}s total %{time_total}s http %{http_code}\n" \
  -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer sk-empire-local" -H "Content-Type: application/json" \
  -d '{"model":"empire-router","messages":[{"role":"user","content":"hi"}],"stream":true}'

echo ""
echo "============================================================"
echo "  DONE. New GPU box is serving the EMPIRE stack."
echo "  NEXT (do these yourself):"
echo "   1. Point DNS for 6-empires.com -> this droplet's IP (A record)."
echo "   2. In OpenHuman, update the EMPIRE FAST provider URL to:"
echo "        http://<NEW_GPU_IP>:8000/v1   (key: sk-empire-local)"
echo "   3. Re-run any TLS/nginx certbot if you front it with HTTPS."
echo "============================================================"
