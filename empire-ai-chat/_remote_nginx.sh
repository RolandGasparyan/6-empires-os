#!/usr/bin/env bash
set -e
CONF=/etc/nginx/sites-enabled/empire
cp "$CONF" "${CONF}.bak.$(date +%s)"

# Insert a /chat location just before the existing "location /" block,
# only if it isn't already present.
if ! grep -q "location /chat" "$CONF"; then
  python3 - "$CONF" <<'PY'
import sys,re
p=sys.argv[1]
s=open(p).read()
chat_block='''    location /chat {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

'''
# put it right before the first "location / {"
s=s.replace("    location / {", chat_block+"    location / {",1)
open(p,"w").write(s)
print("inserted")
PY
fi

nginx -t
systemctl reload nginx
echo "===VERIFY==="
echo "chat-localproxy: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/chat)"
echo "chat-mark:       $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/chat/empire-mark.svg)"
echo "chat-health:     $(curl -s http://127.0.0.1/chat/api/health | head -c 120)"
echo "root-still-up:   $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/)"
