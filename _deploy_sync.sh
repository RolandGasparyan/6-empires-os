#!/usr/bin/env bash
set -euo pipefail

SSHK=~/.ssh/empire_vps
H=root@64.227.6.197
SRC=/Users/rolandgasparyan/6-empires-os/empire-sync
STAGE=/tmp/empire-sync-release

echo "== stage hardened sync service =="
ssh -i "$SSHK" -o StrictHostKeyChecking=no "$H" "rm -rf '$STAGE' && install -d -m 0700 '$STAGE'"
scp -i "$SSHK" -o StrictHostKeyChecking=no \
  "$SRC/server.js" "$SRC/agents.js" "$SRC/package.json" "$SRC/.env.example" "$SRC/brain.json" \
  "$H:$STAGE/"

echo "== install unprivileged service + private control plane =="
ssh -i "$SSHK" -o StrictHostKeyChecking=no "$H" 'bash -s' <<'REMOTE'
set -euo pipefail

STAGE=/tmp/empire-sync-release
APP=/opt/empire-sync

id empire-sync >/dev/null 2>&1 || useradd --system --home-dir "$APP" --shell /usr/sbin/nologin empire-sync
install -d -m 0750 -o empire-sync -g empire-sync "$APP"
install -m 0750 -o empire-sync -g empire-sync "$STAGE/server.js" "$APP/server.js"
install -m 0640 -o empire-sync -g empire-sync "$STAGE/agents.js" "$APP/agents.js"
install -m 0640 -o empire-sync -g empire-sync "$STAGE/package.json" "$APP/package.json"
install -m 0600 -o empire-sync -g empire-sync "$STAGE/brain.json" "$APP/brain.json"
install -m 0600 -o empire-sync -g empire-sync "$STAGE/.env.example" "$APP/.env.example"

if [ ! -f "$APP/.env" ]; then
  install -m 0600 -o empire-sync -g empire-sync "$APP/.env.example" "$APP/.env"
  echo "ERROR: created $APP/.env; set SYNC_ADMIN_TOKEN and rerun deployment" >&2
  exit 1
fi
chown empire-sync:empire-sync "$APP/.env"
chmod 0600 "$APP/.env"

admin_token=$(sed -n 's/^SYNC_ADMIN_TOKEN=//p' "$APP/.env" | tail -1)
if [ "${#admin_token}" -lt 32 ] || printf '%s' "$admin_token" | grep -qi replace; then
  echo "ERROR: SYNC_ADMIN_TOKEN must contain at least 32 random characters" >&2
  exit 1
fi
unset admin_token

cat > /etc/systemd/system/empire-sync.service <<'UNIT'
[Unit]
Description=6-EMPIRE GitHub Sync
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=empire-sync
Group=empire-sync
WorkingDirectory=/opt/empire-sync
EnvironmentFile=/opt/empire-sync/.env
ExecStart=/usr/bin/node /opt/empire-sync/server.js
Restart=on-failure
RestartSec=5s
UMask=0077
NoNewPrivileges=true
PrivateDevices=true
PrivateTmp=true
ProtectControlGroups=true
ProtectHome=true
ProtectKernelModules=true
ProtectKernelTunables=true
ProtectSystem=strict
ReadWritePaths=/opt/empire-sync
RestrictSUIDSGID=true

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable empire-sync >/dev/null 2>&1 || true
systemctl restart empire-sync
sleep 2
systemctl is-active --quiet empire-sync
echo "service: active (user=$(systemctl show -p User --value empire-sync))"

CONF=$(find /etc/nginx/sites-available -maxdepth 1 -type f -name '6-empires*' -print -quit)
if [ -z "$CONF" ]; then
  echo "ERROR: no 6-empires nginx configuration found" >&2
  exit 1
fi

python3 - "$CONF" <<'PY'
import re
import sys

path = sys.argv[1]
with open(path, encoding="utf-8") as handle:
    contents = handle.read()

block = """    # BEGIN EMPIRE-SYNC HARDENED ROUTES
    location = /api/empire/health {
        proxy_pass http://127.0.0.1:8120/api/empire/health;
        proxy_set_header Host $host;
    }
    location = /api/empire/webhook {
        client_max_body_size 32k;
        proxy_pass http://127.0.0.1:8120/api/empire/webhook;
        proxy_set_header Host $host;
    }
    # State, brain, credentials, sync, and agent controls are localhost-only.
    location ^~ /api/empire/ {
        return 404;
    }
    # END EMPIRE-SYNC HARDENED ROUTES
"""

marker = re.compile(
    r"\s*# BEGIN EMPIRE-SYNC HARDENED ROUTES.*?# END EMPIRE-SYNC HARDENED ROUTES\s*",
    re.S,
)
legacy = re.compile(r"\s*location\s+/api/empire/\s*\{[^{}]*\}\s*", re.S)
if marker.search(contents):
    contents = marker.sub("\n" + block, contents, count=1)
elif legacy.search(contents):
    contents = legacy.sub("\n" + block, contents, count=1)
else:
    index = contents.rfind("}")
    if index < 0:
        raise SystemExit("nginx config has no server block")
    contents = contents[:index] + block + contents[index:]

with open(path, "w", encoding="utf-8") as handle:
    handle.write(contents)
PY

nginx -t
systemctl reload nginx
rm -rf "$STAGE"

echo "local health: $(curl -fsS http://127.0.0.1:8120/api/empire/health)"
REMOTE

echo "== public containment verification =="
echo "health: $(curl -sS -o /dev/null -w '%{http_code}' --max-time 12 https://6-empires.com/api/empire/health)"
echo "state blocked: $(curl -sS -o /dev/null -w '%{http_code}' --max-time 12 https://6-empires.com/api/empire/state)"
