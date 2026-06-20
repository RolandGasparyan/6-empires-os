#!/usr/bin/env bash
set -e
cd /root
if [ ! -d /root/6-empires-os ]; then
  git clone https://github.com/RolandGasparyan/6-empires-os.git /root/6-empires-os
fi
cd /root/6-empires-os
git fetch origin
git checkout claude/great-lovelace-aq1yww
git reset --hard origin/claude/great-lovelace-aq1yww

cd /root/6-empires-os/apps/web
echo "=== building empire-world image with basePath /world ==="
docker build -t empire-world:latest \
  --build-arg NEXT_PUBLIC_BASE_PATH=/world \
  --build-arg NEXT_PUBLIC_USE_MOCK=true \
  -f Dockerfile . 2>&1 | tail -6

docker rm -f empire-world 2>/dev/null || true
docker run -d --name empire-world --restart unless-stopped -p 127.0.0.1:3010:3000 empire-world:latest
sleep 8
echo "container: $(docker ps --filter name=empire-world --format '{{.Status}}')"
echo "world root: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3010/world/empire-hq)"
echo "BUILD_DONE"
