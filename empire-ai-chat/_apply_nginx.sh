#!/usr/bin/env bash
set -e
# remove the stray .bak files that nginx may be loading from sites-enabled
rm -f /etc/nginx/sites-enabled/empire.bak.* 2>/dev/null || true
# install the clean config (empire symlink -> sites-available/empire)
cp /tmp/empire.nginx /etc/nginx/sites-available/empire
ln -sf /etc/nginx/sites-available/empire /etc/nginx/sites-enabled/empire
echo "=== sites-enabled ==="
ls /etc/nginx/sites-enabled/
echo "=== nginx -t ==="
nginx -t
systemctl reload nginx
sleep 1
echo "=== verify (HTTPS) ==="
echo "root(/)      -> $(curl -s -o /dev/null -w '%{http_code} loc=%{redirect_url}' https://6-empires.com/)"
echo "world-hq     -> $(curl -s -o /dev/null -w '%{http_code}' https://6-empires.com/world/empire-hq)"
echo "chat/        -> $(curl -s -o /dev/null -w '%{http_code}' https://6-empires.com/chat/)"
echo "chat health  -> $(curl -s https://6-empires.com/chat/api/health | head -c 90)"
echo "webui        -> $(curl -s -o /dev/null -w '%{http_code}' https://6-empires.com/webui/)"
