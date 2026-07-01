#!/usr/bin/env bash
ssh -i ~/.ssh/empire_vps -o StrictHostKeyChecking=no root@64.227.6.197 'bash -s' <<'REMOTE'
set -a; . /opt/empire-sync/.env 2>/dev/null; set +a
echo "token prefix: ${GITHUB_TOKEN:0:10}..."
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" -H "User-Agent: 6-empire" "https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator" \
 | python3 -c 'import sys,json
d=json.load(sys.stdin)
if isinstance(d,list):
    print("REPOS THE TOKEN CAN SEE (%d):"%len(d))
    for r in d: print("  -", r["full_name"])
else:
    print("API response:", json.dumps(d)[:300])'
REMOTE
