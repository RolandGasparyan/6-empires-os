#!/usr/bin/env bash
echo "=== HTTPS chat API endpoints (what the browser calls) ==="
echo "health: $(curl -s -o /dev/null -w '%{http_code}' https://6-empires.com/chat/api/health)"
curl -s https://6-empires.com/chat/api/health | head -c 200
echo
echo "models: $(curl -s -o /dev/null -w '%{http_code}' https://6-empires.com/chat/api/models)"
echo
echo "=== does the served HTML use relative api() (good) or absolute /api (bad)? ==="
curl -s https://6-empires.com/chat/ | grep -oE "api\('/api/[a-z]+'\)|fetch\('/api/[a-z]+'\)|src=\"[^\"]*empire-symbol[^\"]*\"|location.pathname" | sort -u
echo
echo "=== streaming chat over HTTPS (exactly what Send does) ==="
curl -s -N -X POST https://6-empires.com/chat/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"model":"empire-prime","mode":"empire","messages":[{"role":"user","content":"say hi in 3 words"}]}' \
  --max-time 40 | head -c 200
echo
