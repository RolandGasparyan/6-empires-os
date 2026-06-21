#!/usr/bin/env bash
echo "=== HTTPS domain (from the internet) ==="
for u in https://6-empires.com/chat/ https://6-empires.com/world/empire-hq https://6-empires.com/ https://www.6-empires.com/chat/; do
  printf "  %-46s -> %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 "$u")"
done
echo "=== http -> https redirect ==="
printf "  http://6-empires.com/chat/ -> %s (Location: %s)\n" \
  "$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 http://6-empires.com/chat/)" \
  "$(curl -s -o /dev/null -w '%{redirect_url}' --max-time 12 http://6-empires.com/chat/)"
echo "=== TLS cert ==="
echo | openssl s_client -servername 6-empires.com -connect 6-empires.com:443 2>/dev/null | openssl x509 -noout -issuer -dates 2>/dev/null
