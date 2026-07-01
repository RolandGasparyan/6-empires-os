#!/usr/bin/env bash
ssh -i ~/.ssh/empire_vps -o StrictHostKeyChecking=no root@64.227.6.197 'bash -s' <<'REMOTE'
set -e
cd /root/6-empires-os-full
echo "=== .env MODEL_CHAT lines ==="; grep -n '^MODEL_CHAT=' .env || echo none
echo "=== compose env for api ==="; grep -n 'MODEL_CHAT' docker-compose.yml 2>/dev/null || echo "not in compose"
# force a single clean value
sed -i '/^MODEL_CHAT=/d' .env
echo 'MODEL_CHAT=llama3.2' >> .env
echo "=== set to ==="; grep '^MODEL_CHAT=' .env
# fully stop+recreate so env is reloaded
docker compose -f docker-compose.yml stop api >/dev/null 2>&1 || true
docker compose -f docker-compose.yml rm -f api >/dev/null 2>&1 || true
docker compose -f docker-compose.yml up -d api >/dev/null 2>&1
sleep 8
echo "in-container: $(docker exec 6-empires-os-full-api-1 printenv MODEL_CHAT)"
echo "health: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/v1/models)"
REMOTE
