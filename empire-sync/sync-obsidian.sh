#!/usr/bin/env bash
# 6-EMPIRE — Obsidian → VPS brain sync.
# Reads ALL EMPIRE-Vault note folders on this Mac, builds a merged brain.json,
# and pushes it to the VPS so every agent always reads the latest second-brain.
# Source of truth = your Obsidian vault on the Mac. Run on a schedule / on change.
set -e
SSHK=~/.ssh/empire_vps
H=root@64.227.6.197

# every EMPIRE-Vault on disk (add more paths here if you keep vaults elsewhere)
VAULTS=(
  "/Users/rolandgasparyan/Documents/Claude/Projects/6-EMPIRE/EMPIRE-Vault"
  "/Users/rolandgasparyan/6-empires-os/empire-ops/EMPIRE-Vault"
)

python3 - "${VAULTS[@]}" <<'PY' > /tmp/empire-brain.json
import json, os, re, sys, glob
seen={}; notes=[]
for vault in sys.argv[1:]:
    if not os.path.isdir(vault): continue
    for f in sorted(glob.glob(os.path.join(vault, "**", "*.md"), recursive=True)):
        if "/.obsidian/" in f: continue
        title=os.path.splitext(os.path.basename(f))[0]
        raw=open(f, encoding="utf-8", errors="ignore").read()
        body=re.sub(r'^---.*?---\s*', '', raw, flags=re.S)
        text=re.sub(r'\n{3,}', '\n\n', body).strip()[:1800]
        # de-dupe by title, keep the longer version
        if title in seen and len(text) <= len(seen[title]): continue
        seen[title]=text
brain={"source":"EMPIRE-Vault (Obsidian, Mac)","noteCount":len(seen),
       "updated":__import__("datetime").datetime.now().isoformat(),
       "notes":[{"title":t,"text":x} for t,x in seen.items()]}
print(json.dumps(brain, ensure_ascii=False, indent=2))
PY

scp -i "$SSHK" -o StrictHostKeyChecking=no /tmp/empire-brain.json "$H":/opt/empire-sync/brain.json
ssh -i "$SSHK" -o StrictHostKeyChecking=no "$H" "systemctl restart empire-ai 2>/dev/null || true"
echo "[obsidian-sync] pushed $(python3 -c 'import json;print(json.load(open("/tmp/empire-brain.json"))["noteCount"])') notes  $(date)"
