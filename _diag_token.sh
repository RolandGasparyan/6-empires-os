#!/usr/bin/env bash
ssh -i ~/.ssh/empire_vps -o StrictHostKeyChecking=no root@64.227.6.197 'bash -s' <<'REMOTE'
set -a; . /opt/empire-sync/.env 2>/dev/null; set +a
echo "token in .env: ${GITHUB_TOKEN:0:18}...  (len ${#GITHUB_TOKEN})"
echo "token mtime:  $(stat -c %y /opt/empire-sync/.env | cut -d. -f1)"
echo "--- what this token can read ---"
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" -H "User-Agent: 6e" \
  "https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator" \
  | python3 -c 'import sys,json
d=json.load(sys.stdin)
if isinstance(d,list):
    print("repos visible:",len(d))
    for r in d: print("   -",r["full_name"])
else:
    print("API said:",json.dumps(d)[:200])'
echo "--- direct probe of the 3 missing repos ---"
for r in trading-guru-empire strategy-lab-mac dzayn-app; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $GITHUB_TOKEN" -H "User-Agent: 6e" "https://api.github.com/repos/RolandGasparyan/$r")
  echo "   RolandGasparyan/$r -> $code"
done
REMOTE
