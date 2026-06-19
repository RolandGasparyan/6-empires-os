#!/usr/bin/env bash
echo "=== nginx /chat UI ==="
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: 6-empires.com" http://127.0.0.1/chat
echo "=== live chat: empire-prime, mode=empire ==="
curl -s -N -X POST -H "Host: 6-empires.com" -H "Content-Type: application/json" \
  http://127.0.0.1/chat/api/chat \
  -d '{"model":"empire-prime","mode":"empire","messages":[{"role":"user","content":"State the 6-EMPIRE mission in one line."}]}' \
  --max-time 50 | head -c 400
echo
