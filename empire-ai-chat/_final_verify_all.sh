#!/usr/bin/env bash
B=https://6-empires.com
echo "################ FINAL FULL VERIFICATION ################"
echo "date: $(date)"
echo
echo "== ROUTES (HTTPS) =="
for u in "$B/" "$B/world/empire-hq" "$B/chat/" "$B/chat/api/health" "$B/webui/"; do
  printf "  %-40s -> %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 "$u")"
done
echo "  http->https: $(curl -s -o /dev/null -w '%{http_code}' --max-time 12 http://6-empires.com/world/empire-hq)"
echo
echo "== LOGO (real png) =="
echo "  chat logo png:  $(curl -s -o /dev/null -w '%{http_code}' $B/chat/empire-logo.png)"
echo "  world logo png: $(curl -s -o /dev/null -w '%{http_code}' $B/world/empire-logo.png)"
echo "  chat HTML uses empire-logo.png: $(curl -s $B/chat/ | grep -oc 'empire-logo.png')x"
echo "  world HTML uses empire-logo.png: $(curl -s $B/world/empire-hq | grep -oc 'empire-logo.png')x"
echo
echo "== 3D WORLD content markers =="
curl -s $B/world/empire-hq | grep -oE 'EMPIRE|ENTER THE EMPIRE|/world/_next|empire-hq|Roland Gasparyan' | sort -u | tr '\n' ' '
echo
echo "== TEAM (English names + Roland) in bundle =="
curl -s $B/world/empire-hq | grep -oE 'CORPORATION|LIVING HQ|12 AGENTS' | sort -u | tr '\n' ' '
echo
echo "== EMPIRE MODELS =="
curl -s $B/chat/api/health | head -c 280
echo
echo "== LIVE CHAT (empire-prime / EMPIRE CORE) =="
curl -s -N -X POST $B/chat/api/chat -H 'Content-Type: application/json' \
  -d '{"model":"empire-prime","mode":"empire","messages":[{"role":"user","content":"In one line: confirm 6-EMPIRE is fully operational."}]}' --max-time 45 | head -c 220
echo
echo "== SSL =="
echo | openssl s_client -servername 6-empires.com -connect 6-empires.com:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null
echo
echo "== SERVICES =="
echo "  chat:  $(systemctl is-active empire-ai)   world: $(docker ps --filter name=empire-world --format '{{.Status}}')   webui: $(docker ps --filter name=empire-prime-webui --format '{{.Status}}')   ollama: $(systemctl is-active ollama)"
echo "################ END ################"
