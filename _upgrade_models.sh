#!/usr/bin/env bash
ssh -i ~/.ssh/empire_vps -o StrictHostKeyChecking=no root@64.227.6.197 'bash -s' <<'REMOTE'
set -e
cd /root/6-empires-os-full
echo "=== before (all MODEL_CHAT lines) ==="; grep -n '^MODEL_CHAT=' .env || true
# remove ALL existing MODEL_CHAT / MODEL_CODING lines, then add clean ones at the end
sed -i '/^MODEL_CHAT=/d; /^MODEL_CODING=/d' .env
printf 'MODEL_CHAT=nous-hermes2\nMODEL_CODING=mistral\n' >> .env
echo "=== after ==="; grep -E '^MODEL_CHAT=|^MODEL_CODING=' .env
docker compose -f /root/6-empires-os-full/docker-compose.yml up -d --force-recreate api 2>&1 | tail -2
sleep 8
echo "in-container MODEL_CHAT=$(docker exec 6-empires-os-full-api-1 printenv MODEL_CHAT)"
echo "router health: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/v1/models)"
REMOTE
