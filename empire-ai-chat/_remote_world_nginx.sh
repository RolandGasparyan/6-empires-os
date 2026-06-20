#!/usr/bin/env bash
set -e
CONF=/etc/nginx/sites-enabled/empire
cp "$CONF" "${CONF}.bak.world.$(date +%s)"

if ! grep -q "location /world" "$CONF"; then
  python3 - "$CONF" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
block='''    # Polished 3D world (Next.js app on :3010, basePath /world).
    location /world {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

'''
s=s.replace("    location / {", block+"    location / {",1)
open(p,"w").write(s); print("inserted /world")
PY
fi
nginx -t && systemctl reload nginx
echo "=== verify via Host header ==="
echo "world-hq:   $(curl -s -o /dev/null -w '%{http_code}' -H 'Host: 6-empires.com' http://127.0.0.1/world/empire-hq)"
echo "root-webui: $(curl -s -o /dev/null -w '%{http_code}' -H 'Host: 6-empires.com' http://127.0.0.1/)"
echo "chat-still: $(curl -s -o /dev/null -w '%{http_code}' -H 'Host: 6-empires.com' http://127.0.0.1/chat)"
