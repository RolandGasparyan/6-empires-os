#!/usr/bin/env bash
set -e
SSHK=~/.ssh/empire_vps
H=root@64.227.6.197
scp -i $SSHK -o StrictHostKeyChecking=no /Users/rolandgasparyan/6-empires-os/empire-ai-chat/server.js $H:/opt/empire-ai-chat/
ssh -i $SSHK -o StrictHostKeyChecking=no $H 'bash -s' <<'REMOTE'
set -e
# pull the Groq key from the sync .env into the empire-ai service environment
GK=$(grep '^FREE_GROQ_KEY=' /opt/empire-sync/.env 2>/dev/null | cut -d= -f2-)
if [ -n "$GK" ]; then
  # make sure the empire-ai systemd unit exports it
  mkdir -p /etc/systemd/system/empire-ai.service.d
  printf '[Service]\nEnvironment=FREE_GROQ_KEY=%s\nEnvironment=GROQ_MODEL=llama-3.3-70b-versatile\n' "$GK" > /etc/systemd/system/empire-ai.service.d/groq.conf
  systemctl daemon-reload
  echo "groq key wired into empire-ai (tail ${GK: -6})"
else
  echo "WARN: no Groq key in sync .env"
fi
systemctl restart empire-ai
sleep 2
echo "empire-ai: $(systemctl is-active empire-ai)"
REMOTE
echo "== live test (Groq 70B via EMPIRE chat) =="
