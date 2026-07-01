#!/usr/bin/env bash
set -e
ssh -i ~/.ssh/empire_vps -o StrictHostKeyChecking=no root@64.227.6.197 'bash -s' <<'REMOTE'
set -e
# locate the compose project dir for the api container
DIR=$(docker inspect 6-empires-os-full-api-1 --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' 2>/dev/null)
CF=$(docker inspect 6-empires-os-full-api-1 --format '{{ index .Config.Labels "com.docker.compose.project.config_files" }}' 2>/dev/null)
echo "compose dir: $DIR"
echo "compose file: $CF"
cd "$DIR" 2>/dev/null || cd /root/6-empires-os-full
# ensure the key is in this dir's .env
grep -q '^FREE_GROQ_KEY=' .env 2>/dev/null && echo "key in .env: yes" || echo "key in .env: NO"
# recreate api so it reloads env from .env
docker compose -f "$CF" up -d --force-recreate api 2>&1 | tail -2 || docker compose up -d --force-recreate api 2>&1 | tail -2
sleep 7
echo "key inside container: $(docker exec 6-empires-os-full-api-1 printenv FREE_GROQ_KEY 2>/dev/null | cut -c1-7)***"
echo "router /v1/models: $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/v1/models)"
REMOTE
