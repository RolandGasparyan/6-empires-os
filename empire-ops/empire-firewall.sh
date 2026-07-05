#!/usr/bin/env bash
# 6-EMPIRE host firewall — block internal services from the public internet.
# Strategy: DROP only traffic arriving on the public interface (eth0).
#   - loopback (lo) and docker bridge (docker0/br-*) never match -> localhost
#     and inter-container networking are completely untouched.
#   - SSH(22), HTTP(80), HTTPS(443), and Open WebUI login(9090) stay public.
set -u
IFACE=eth0

# host-process ports (same-port, INPUT chain). nginx proxies 8090/8120; ollama+demo internal only.
HOST_PORTS="8001 8090 8120 11434"
# docker-published SAME-PORT data services (DOCKER-USER chain). 9090 kept public (login UI).
DOCK_PORTS="5432 6379 6333 7474 7687 8000"

drop_input(){ # $1=port  (v4+v6)
  iptables  -C INPUT -i "$IFACE" -p tcp --dport "$1" -j DROP 2>/dev/null || iptables  -A INPUT -i "$IFACE" -p tcp --dport "$1" -j DROP
  ip6tables -C INPUT -i "$IFACE" -p tcp --dport "$1" -j DROP 2>/dev/null || ip6tables -A INPUT -i "$IFACE" -p tcp --dport "$1" -j DROP
}
drop_docker(){ # $1=port (v4+v6)
  iptables  -C DOCKER-USER -i "$IFACE" -p tcp --dport "$1" -j DROP 2>/dev/null || iptables  -I DOCKER-USER -i "$IFACE" -p tcp --dport "$1" -j DROP
  ip6tables -C DOCKER-USER -i "$IFACE" -p tcp --dport "$1" -j DROP 2>/dev/null || ip6tables -I DOCKER-USER -i "$IFACE" -p tcp --dport "$1" -j DROP 2>/dev/null || true
}

for p in $HOST_PORTS; do drop_input  "$p"; done
for p in $DOCK_PORTS; do drop_docker "$p"; done

# persist
mkdir -p /etc/iptables
iptables-save  > /etc/iptables/rules.v4 2>/dev/null || true
ip6tables-save > /etc/iptables/rules.v6 2>/dev/null || true
echo "[empire-firewall] applied on $IFACE: INPUT drop [$HOST_PORTS] DOCKER-USER drop [$DOCK_PORTS]"
