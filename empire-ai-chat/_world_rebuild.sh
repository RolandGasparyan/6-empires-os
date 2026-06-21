#!/usr/bin/env bash
set -e
cd /root/6-empires-os
git fetch origin
git reset --hard origin/claude/great-lovelace-aq1yww
cd apps/web
echo "=== rebuilding empire-world (flat ground, faster) ==="
docker build -t empire-world:latest \
  --build-arg NEXT_PUBLIC_BASE_PATH=/world \
  --build-arg NEXT_PUBLIC_USE_MOCK=true \
  -f Dockerfile . 2>&1 | tail -5
docker rm -f empire-world 2>/dev/null || true
docker run -d --name empire-world --restart unless-stopped \
  -e NEXT_PUBLIC_BASE_PATH=/world \
  -p 127.0.0.1:3010:3000 empire-world:latest
sleep 8
echo "status: $(docker ps --filter name=empire-world --format '{{.Status}}')"
echo "world-hq: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3010/world/empire-hq)"
echo "REBUILD_DONE"
