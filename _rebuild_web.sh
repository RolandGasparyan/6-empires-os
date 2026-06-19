#!/usr/bin/env bash
set -e
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
cd ~/6-empires-os
echo "=== physically remove any nested duplicate three (stats-gl etc.) ==="
find apps/web/node_modules -path '*/node_modules/three' -maxdepth 6 -type d -prune -exec rm -rf {} + 2>/dev/null || true
find apps/web/node_modules -path '*/stats-gl/node_modules' -type d -prune -exec rm -rf {} + 2>/dev/null || true
echo "remaining three copies:"; find apps/web/node_modules -name 'three' -type d -path '*/three' | grep -c three || true
echo "=== distinct three versions resolved in lockfile ==="
grep -oE '"version": "0\.1[0-9][0-9]\.[0-9]+"' apps/web/package-lock.json | sort | uniq -c | grep -E '0\.169|0\.170' || echo "(none of 0.169/0.170 lines — check manually)"
echo "=== docker build web (no-cache) ==="
docker compose -f config/docker-compose.local.yml build --no-cache web 2>&1 | grep -iE "compiled successfully|generating static|Built|error|failed|exit code" | tail -10
echo "=== up ==="
docker compose -f config/docker-compose.local.yml up -d web 2>&1 | tail -3
sleep 10
echo "=== curl ==="
curl -s -o /dev/null -w "web /hq HTTP %{http_code}\n" http://localhost:3001/hq
echo "=== DONE ==="
