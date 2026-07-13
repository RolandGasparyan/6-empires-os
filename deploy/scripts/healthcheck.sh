#!/usr/bin/env bash
# 6-EMPIRE OS — live infrastructure health check. Run on the VPS.
set -Eeuo pipefail
DOMAINS=("6-empires.com" "www.6-empires.com" "api.6-empires.com" "chat.6-empires.com")
failures=0
echo "=== 6-EMPIRE OS HEALTH CHECK — $(date) ==="

echo; echo "## HTTPS / HTTP 200"
for d in "${DOMAINS[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$d/" || true)
  if [[ "$code" != "200" ]]; then
    failures=$((failures + 1))
  fi
  code="${code:-ERR}"
  printf "  %-22s HTTP %s\n" "$d" "$code"
done

echo; echo "## API health endpoint"
if ! curl -fsS --max-time 10 https://api.6-empires.com/ready; then
  echo "  API not ready"
  failures=$((failures + 1))
fi
echo

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
if ((failures)); then
  echo "health check failed: $failures endpoint check(s) failed" >&2
  exit 1
fi
