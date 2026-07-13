#!/usr/bin/env bash
# 6-EMPIRE — Obsidian → VPS brain sync.
# Reads the ONE canonical Second Brain vault on this Mac (all ventures
# consolidated into it 2026-07-03), builds a merged brain.json capped to
# the most recently touched notes so prompt injection stays fast/bounded
# even as the vault grows, and pushes it to the VPS so every agent always
# reads the latest second-brain.
# Source of truth = your Obsidian vault on the Mac. Run on a schedule / on change.
set -e
SSHK=~/.ssh/empire_vps
H=root@64.227.6.197

# single canonical vault (all ventures consolidated here 2026-07-03;
# add more paths here only if you start a genuinely separate vault later)
VAULTS=(
  "/Users/rolandgasparyan/EmpireMemory/Obsidian_Second_Brain"
)

# cap how many notes get injected into the live chat context -- the vault
# itself can keep growing without limit, but brain.json stays bounded so
# the CPU-only box doesn't choke on prompt size. Most-recently-modified
# notes win, so the freshest work is always what the chat can see.
MAX_NOTES=120
MAX_CHARS_PER_NOTE=1800

python3 - "${VAULTS[@]}" <<PY > /tmp/empire-brain.json
import json, os, re, sys, glob

MAX_NOTES = ${MAX_NOTES}
MAX_CHARS = ${MAX_CHARS_PER_NOTE}
# noisy non-knowledge subfolders to skip even though they may contain .md
EXCLUDE_MARKERS = ["/.git/", "/.obsidian/", "/.trash/", "/node_modules/", "/backups/", "/__pycache__/"]
# core meta notes always win a slot regardless of recency -- these are the
# load-bearing facts (VPS IP, model list, chat routing) the whole ecosystem
# depends on, and a busy day of edits elsewhere must never push them out.
PRIORITY_MARKERS = ["/00_meta/"]
PRIORITY_TITLES = {"infrastructure", "empire os", "empire ai chat", "free llm apis",
                    "god mode prompts", "models", "openhuman", "pending actions"}

SECRET_PATTERNS = [
    re.compile(r'(?i)\b(login|password|passphrase|token|api[ _-]?key|client[ _-]?secret)\s*[:=]\s*[^\n`]+'),
    re.compile(r'(?<![A-Za-z0-9_])(?:github_pat_|ghp_|gsk_|sk-)[A-Za-z0-9_-]{8,}'),
]

def redact_sensitive(text):
    for pattern in SECRET_PATTERNS:
        text = pattern.sub(lambda match: match.group(0).split(":", 1)[0].split("=", 1)[0] + ": [REDACTED]"
                           if re.search(r'[:=]', match.group(0)) else "[REDACTED]", text)
    return text

candidates = []  # (mtime, path)
for vault in sys.argv[1:]:
    if not os.path.isdir(vault):
        continue
    for f in glob.glob(os.path.join(vault, "**", "*.md"), recursive=True):
        norm = f.replace(os.sep, "/")
        if any(m in norm for m in EXCLUDE_MARKERS):
            continue
        try:
            mtime = os.path.getmtime(f)
        except OSError:
            continue
        candidates.append((mtime, f))

def is_priority(path):
    norm = path.replace(os.sep, "/").lower()
    if any(m in norm for m in PRIORITY_MARKERS):
        return True
    title = os.path.splitext(os.path.basename(path))[0].lower()
    return title in PRIORITY_TITLES

candidates.sort(key=lambda t: (not is_priority(t[1]), -t[0]))

seen = {}
for _, f in candidates:
    if len(seen) >= MAX_NOTES:
        break
    title = os.path.splitext(os.path.basename(f))[0]
    try:
        raw = open(f, encoding="utf-8", errors="ignore").read()
    except OSError:
        continue
    body = re.sub(r'^---.*?---\s*', '', raw, flags=re.S)
    text = redact_sensitive(re.sub(r'\n{3,}', '\n\n', body)).strip()[:MAX_CHARS]
    if title in seen and len(text) <= len(seen[title]):
        continue
    seen[title] = text

brain = {"source": "6-EMPIRE Second Brain (Obsidian, Mac) -- most-recent " + str(MAX_NOTES) + " notes",
         "noteCount": len(seen),
         "updated": __import__("datetime").datetime.now().isoformat(),
         "notes": [{"title": t, "text": x} for t, x in seen.items()]}
print(json.dumps(brain, ensure_ascii=False, indent=2))
PY

scp -i "$SSHK" -o StrictHostKeyChecking=no /tmp/empire-brain.json "$H":/opt/empire-sync/brain.json
ssh -i "$SSHK" -o StrictHostKeyChecking=no "$H" "chown empire-sync:empire-sync /opt/empire-sync/brain.json && chmod 600 /opt/empire-sync/brain.json"
ssh -i "$SSHK" -o StrictHostKeyChecking=no "$H" "systemctl restart empire-ai 2>/dev/null || true"
echo "[obsidian-sync] pushed $(python3 -c 'import json;print(json.load(open("/tmp/empire-brain.json"))["noteCount"])') notes (capped, most-recent)  $(date)"
