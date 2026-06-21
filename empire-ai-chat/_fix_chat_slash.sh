#!/usr/bin/env bash
set -e
CONF=/etc/nginx/sites-enabled/empire
cp "$CONF" "${CONF}.bak.slash.$(date +%s)"

# Ensure a redirect from /chat to /chat/ so the app's relative asset paths
# (empire-symbol.svg, api/health) resolve under /chat/ not site root.
if ! grep -q "location = /chat " "$CONF"; then
  python3 - "$CONF" <<'PY'
import sys
p=sys.argv[1]; s=open(p).read()
redir='    location = /chat { return 301 /chat/; }\n'
# insert right before the existing "location /chat {" block
s=s.replace("    location /chat {", redir+"    location /chat {",1)
open(p,"w").write(s); print("added /chat -> /chat/ redirect")
PY
fi
nginx -t && systemctl reload nginx
echo "redirect: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/chat)"
echo "slash-ui: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/chat/)"
echo "symbol:   $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/chat/empire-symbol.svg)"
echo "health:   $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/chat/api/health)"
