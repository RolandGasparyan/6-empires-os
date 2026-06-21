#!/usr/bin/env bash
H="-H Host:6-empires.com"
echo "================ 6-EMPIRES VPS FINAL VERIFICATION ================"
echo "--- services / containers ---"
echo "empire-ai (chat):  $(systemctl is-active empire-ai)"
echo "empire-world (3D): $(docker ps --filter name=empire-world --format '{{.Status}}')"
echo "open-webui (root): $(docker ps --filter name=empire-prime-webui --format '{{.Status}}')"
echo
echo "--- HTTP (via nginx, Host=6-empires.com) ---"
for path in / /chat /chat/empire-symbol.svg /world /world/empire-hq; do
  code=$(curl -s -o /dev/null -w '%{http_code}' $H "http://127.0.0.1$path")
  echo "  $path  ->  $code"
done
echo
echo "--- EMPIRE AI health (models) ---"
curl -s $H http://127.0.0.1/chat/api/health | head -c 260
echo
echo "--- live model reply (empire-prime, EMPIRE CORE mode) ---"
curl -s -N -X POST $H -H 'Content-Type: application/json' http://127.0.0.1/chat/api/chat \
  -d '{"model":"empire-prime","mode":"empire","messages":[{"role":"user","content":"Reply in one short line: status of the 6-EMPIRE system."}]}' \
  --max-time 45 | head -c 300
echo
echo "================ END ================"
