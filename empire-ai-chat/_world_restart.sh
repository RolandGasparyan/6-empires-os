#!/usr/bin/env bash
docker rm -f empire-world 2>/dev/null || true
sleep 1
docker run -d --name empire-world --restart unless-stopped \
  -e NEXT_PUBLIC_BASE_PATH=/world \
  -p 127.0.0.1:3010:3000 empire-world:latest
sleep 8
echo "status: $(docker ps --filter name=empire-world --format '{{.Status}}')"
for p in /world /world/empire-hq /empire-hq; do
  printf "%s = " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:3010$p"
done
