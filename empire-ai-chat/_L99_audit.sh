#!/usr/bin/env bash
B=https://6-empires.com
echo "################ L99 FINAL AUDIT — 6-EMPIRES ################"
echo "date: $(date)"
echo
echo "== 1. ROUTES (HTTPS) =="
for u in "$B/" "$B/world/empire-hq" "$B/chat/" "$B/chat/api/health" "$B/webui/"; do
  printf "  %-42s -> %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 "$u")"
done
echo "  http->https redirect: $(curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' --max-time 12 http://6-empires.com/)"
echo
echo "== 2. LOGO present on each surface =="
echo "  chat header/hero symbol: $(curl -s -o /dev/null -w '%{http_code}' $B/chat/empire-symbol.svg)"
echo "  chat full mark:          $(curl -s -o /dev/null -w '%{http_code}' $B/chat/empire-mark.svg)"
echo "  world header mark:       $(curl -s -o /dev/null -w '%{http_code}' $B/world/empire-mark.svg)"
echo "  world enter-gate logo:   $(curl -s -o /dev/null -w '%{http_code}' $B/world/empire-logo.svg)"
echo "  chat HTML references logo: $(curl -s $B/chat/ | grep -oc 'empire-symbol.svg')x"
echo "  world HTML references logo: $(curl -s $B/world/empire-hq | grep -oE 'empire-(mark|logo).svg' | sort -u | tr '\n' ' ')"
echo
echo "== 3. MODELS (EMPIRE) =="
curl -s $B/chat/api/health | head -c 300
echo
echo "== 4. LIVE CHAT (empire-prime, EMPIRE CORE) =="
curl -s -N -X POST $B/chat/api/chat -H 'Content-Type: application/json' \
  -d '{"model":"empire-prime","mode":"empire","messages":[{"role":"user","content":"Reply one line: audit status?"}]}' --max-time 40 | head -c 160
echo
echo "== 5. SSL CERT =="
echo | openssl s_client -servername 6-empires.com -connect 6-empires.com:443 2>/dev/null | openssl x509 -noout -issuer -dates 2>/dev/null
echo
echo "== 6. SERVICES / HEALTH =="
echo "  chat svc:   $(systemctl is-active empire-ai)"
echo "  world ctr:  $(docker ps --filter name=empire-world --format '{{.Status}}')"
echo "  webui ctr:  $(docker ps --filter name=empire-prime-webui --format '{{.Status}}')"
echo "  ollama:     $(systemctl is-active ollama)"
free -h | awk 'NR<=2'
echo "################ END L99 AUDIT ################"
