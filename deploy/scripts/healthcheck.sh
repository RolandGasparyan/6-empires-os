#!/usr/bin/env bash
# 6-EMPIRE OS — live infrastructure health check. Run on the VPS.
set -u
DOMAINS=("6-empires.com" "www.6-empires.com" "api.6-empires.com" "chat.6-empires.com")
echo "=== 6-EMPIRE OS HEALTH CHECK — $(date) ==="

echo; echo "## HTTPS / HTTP 200"
for d in "${DOMAINS[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$d/" || echo "ERR")
  printf "  %-22s HTTP %s\n" "$d" "$code"
done

echo; echo "## API health endpoint"
curl -s --max-time 10 https://api.6-empires.com/health || echo "  API unreachable"; echo

echo; echo "## SSL certificate expiry"
for d in "6-empires.com" "api.6-empires.com"; do
  exp=$(echo | openssl s_client -servername "$d" -connect "$d:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  printf "  %-22s expires: %s\n" "$d" "${exp:-UNKNOWN}"
done

echo; echo "## Docker containers"
docker compose -f config/docker-compose.prod.yml ps 2>/dev/null || docker ps

echo; echo "## Resources"
echo "  CPU/mem:"; top -bn1 | head -5 2>/dev/null
echo "  Disk:"; df -h / | tail -1
echo "  RAM:"; free -h 2>/dev/null | head -2

echo; echo "=== END ==="
