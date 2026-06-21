#!/usr/bin/env bash
H="-H Host:6-empires.com"
echo "================ 6-EMPIRES — FULL VERIFICATION ================"
echo "date: $(date)"
echo
echo "--- containers / services ---"
echo "empire-ai (chat):  $(systemctl is-active empire-ai)"
echo "empire-world (3D): $(docker ps --filter name=empire-world --format '{{.Status}}')"
echo "open-webui (root): $(docker ps --filter name=empire-prime-webui --format '{{.Status}}')"
echo "ollama:            $(systemctl is-active ollama 2>/dev/null || echo via-docker)"
echo
echo "--- HTTP routes via nginx (Host=6-empires.com) ---"
for p in / /chat /chat/ /chat/empire-symbol.svg /chat/api/health /world /world/empire-hq; do
  printf "  %-30s -> %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' $H http://127.0.0.1$p)"
done
echo
echo "--- public reachability by IP (Host header) ---"
for p in /chat/ /world/empire-hq; do
  printf "  64.227.6.197%-22s -> %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 $H http://64.227.6.197$p)"
done
echo
echo "--- EMPIRE AI models ---"
curl -s $H http://127.0.0.1/chat/api/health | head -c 320
echo
echo "--- world HTML markers (basePath + logo + title) ---"
curl -s $H http://127.0.0.1/world/empire-hq | grep -oE 'EMPIRE|ENTER THE EMPIRE|/world/_next|/world/empire-mark.svg|empire-hq' | sort -u | tr '\n' ' '
echo
echo "--- world asset (logo under /world) ---"
echo "  empire-mark.svg -> $(curl -s -o /dev/null -w '%{http_code}' $H http://127.0.0.1/world/empire-mark.svg)"
echo
echo "--- box health ---"
free -h | awk 'NR<=2'
echo "================ END ================"
