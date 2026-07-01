#!/usr/bin/env bash
set -e
SSHK=~/.ssh/empire_vps
H=root@64.227.6.197
SRC=/Users/rolandgasparyan/6-empires-os/empire-sync

echo "== copy sync service =="
ssh -i $SSHK -o StrictHostKeyChecking=no $H "mkdir -p /opt/empire-sync"
scp -i $SSHK -o StrictHostKeyChecking=no "$SRC/server.js" "$SRC/.env.example" "$SRC/brain.json" $H:/opt/empire-sync/
# chat backend (now injects the Obsidian brain into agent prompts)
scp -i $SSHK -o StrictHostKeyChecking=no /Users/rolandgasparyan/6-empires-os/empire-ai-chat/server.js $H:/opt/empire-ai-chat/ 2>/dev/null || true
ssh -i $SSHK -o StrictHostKeyChecking=no $H "systemctl restart empire-ai 2>/dev/null || true"

echo "== install systemd unit + nginx route + start =="
ssh -i $SSHK -o StrictHostKeyChecking=no $H 'bash -s' <<'REMOTE'
set -e
# seed .env from example only if it doesn't exist (preserve a real token if already set)
[ -f /opt/empire-sync/.env ] || cp /opt/empire-sync/.env.example /opt/empire-sync/.env

cat > /etc/systemd/system/empire-sync.service <<'UNIT'
[Unit]
Description=6-EMPIRE GitHub Sync
After=network.target
[Service]
WorkingDirectory=/opt/empire-sync
ExecStart=/usr/bin/node /opt/empire-sync/server.js
Restart=always
[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable empire-sync >/dev/null 2>&1 || true
systemctl restart empire-sync
sleep 2
echo "service: $(systemctl is-active empire-sync)"

# nginx: proxy /api/empire/ -> :8120  (insert into the server block if missing)
if ! grep -q "location /api/empire/" /etc/nginx/sites-available/6-empires* 2>/dev/null; then
  CONF=$(ls /etc/nginx/sites-available/6-empires* 2>/dev/null | head -1)
  if [ -n "$CONF" ]; then
    # add the location just before the last closing brace of the ssl server block
    python3 - "$CONF" <<'PY'
import sys,re
p=sys.argv[1]; s=open(p).read()
block="""    location /api/empire/ {
        proxy_pass http://127.0.0.1:8120/api/empire/;
        proxy_set_header Host $host;
    }
"""
if "/api/empire/" not in s:
    # insert before the final '}' of the 443 server block (last '}' in file is safe-ish)
    idx=s.rfind("}")
    s=s[:idx]+block+s[idx:]
    open(p,"w").write(s)
    print("nginx route added to",p)
else:
    print("route already present")
PY
    nginx -t && systemctl reload nginx && echo "nginx reloaded"
  else
    echo "WARN: no 6-empires nginx conf found; add /api/empire/ proxy manually"
  fi
fi

echo "== local state =="
curl -s http://127.0.0.1:8120/api/empire/state | head -c 400
REMOTE
echo
echo "== https verify =="
echo "api/empire/state: $(curl -s -o /dev/null -w '%{http_code}' --max-time 12 https://6-empires.com/api/empire/state)"
