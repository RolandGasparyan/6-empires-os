#!/usr/bin/env bash
set -e
# Ensure certbot is present
if ! command -v certbot >/dev/null 2>&1; then
  apt-get update -y >/dev/null 2>&1
  apt-get install -y certbot python3-certbot-nginx >/dev/null 2>&1
fi

# Only request cert for hostnames that actually resolve to THIS box.
MYIP=$(curl -s -4 ifconfig.me)
DOMAINS=""
for d in 6-empires.com www.6-empires.com; do
  rip=$(getent hosts "$d" | awk '{print $1}' | head -1)
  echo "  $d resolves to $rip (this box: $MYIP)"
  if [ "$rip" = "$MYIP" ]; then DOMAINS="$DOMAINS -d $d"; fi
done
echo "Requesting cert for:$DOMAINS"

certbot --nginx $DOMAINS --non-interactive --agree-tos --redirect \
  -m roland.gasparyan@gmail.com 2>&1 | tail -15

echo "=== nginx reload ==="
nginx -t && systemctl reload nginx
echo "=== verify https ==="
echo "https chat:  $(curl -s -o /dev/null -w '%{http_code}' https://6-empires.com/chat/)"
echo "https world: $(curl -s -o /dev/null -w '%{http_code}' https://6-empires.com/world/empire-hq)"
echo "http->https: $(curl -s -o /dev/null -w '%{http_code}' http://6-empires.com/chat/)"
