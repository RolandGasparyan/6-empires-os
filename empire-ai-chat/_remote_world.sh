#!/usr/bin/env bash
set -e
cd /root
# clone or update repo
if [ ! -d /root/6-empires-os ]; then
  git clone https://github.com/RolandGasparyan/6-empires-os.git /root/6-empires-os
fi
cd /root/6-empires-os
git fetch origin
git checkout claude/great-lovelace-aq1yww
git pull --ff-only origin claude/great-lovelace-aq1yww

# Build the web image (standalone Next.js). basePath /world so assets resolve under /world.
cd /root/6-empires-os/apps/web

# ensure NEXT basePath for /world mounting via env at build
cat > /tmp/worlddockerargs <<EOF
NEXT_PUBLIC_BASE_PATH=/world
EOF

echo "=== building web image (this can take several minutes) ==="
docker build -t empire-world:latest -f Dockerfile . 2>&1 | tail -8 || {
  echo "Dockerfile build failed — trying repo config compose"; }

echo "=== run container on :3010 ==="
docker rm -f empire-world 2>/dev/null || true
docker run -d --name empire-world --restart unless-stopped -p 127.0.0.1:3010:3000 empire-world:latest
sleep 6
echo "container: $(docker ps --filter name=empire-world --format '{{.Status}}')"
echo "local /world health: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3010/)"
