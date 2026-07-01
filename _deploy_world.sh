#!/usr/bin/env bash
set -e
SSHK=~/.ssh/empire_vps
H=root@64.227.6.197
EX=/Users/rolandgasparyan/6-empires-os/apps/web/src/components/executive
HQ=/Users/rolandgasparyan/6-empires-os/apps/web/src/app/empire-hq
LAY=/Users/rolandgasparyan/6-empires-os/apps/web/src/app
CHAT=/Users/rolandgasparyan/6-empires-os/empire-ai-chat
DST=/root/6-empires-os/apps/web/src

echo "== copy changed source =="
scp -i $SSHK -o StrictHostKeyChecking=no \
  "$EX/ConnectedWorld.tsx" "$EX/HumanCharacter.tsx" "$EX/useExecAudio.ts" \
  $H:$DST/components/executive/
scp -i $SSHK -o StrictHostKeyChecking=no "$HQ/page.tsx" $H:$DST/app/empire-hq/
scp -i $SSHK -o StrictHostKeyChecking=no "$LAY/layout.tsx" $H:$DST/app/
# chat UI (clean black background)
scp -i $SSHK -o StrictHostKeyChecking=no "$CHAT/index.html" $H:/opt/empire-ai-chat/ 2>/dev/null || true

echo "== build + recreate empire-world (basePath /world) + restart chat =="
ssh -i $SSHK -o StrictHostKeyChecking=no $H 'bash -s' <<'REMOTE'
set -e
systemctl restart empire-ai 2>/dev/null || true
cd /root/6-empires-os/apps/web
docker build --build-arg NEXT_PUBLIC_BASE_PATH=/world -t empire-world:latest . > /tmp/world_build.log 2>&1 || { echo BUILD_FAILED; tail -40 /tmp/world_build.log; exit 1; }
echo BUILD_OK
docker rm -f empire-world >/dev/null 2>&1 || true
docker run -d --name empire-world --restart unless-stopped -p 3010:3000 -e NEXT_PUBLIC_BASE_PATH=/world empire-world:latest >/dev/null
sleep 4
docker ps --filter name=empire-world --format '{{.Status}}'
REMOTE
echo "== verify =="
sleep 2
echo "world-hq: $(curl -s -o /dev/null -w '%{http_code}' --max-time 15 https://6-empires.com/world/empire-hq)"
echo "chat:     $(curl -s -o /dev/null -w '%{http_code}' --max-time 15 https://6-empires.com/chat/)"
echo "chat black bg: $(curl -s https://6-empires.com/chat/ | grep -oc 'background:#000')x  marble refs: $(curl -s https://6-empires.com/chat/ | grep -oc 'marble-bg')x"
