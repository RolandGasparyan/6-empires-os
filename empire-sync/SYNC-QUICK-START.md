# 6-EMPIRE Sync Quick Start

## Three-system sync in 60 seconds

### 1️⃣ GitHub Project → VPS Deployment

**What it does**: Auto-deploy code when CI passes

```bash
# Just push!
git push origin main

# Behind the scenes:
# 1. CI tests API & Web (2min)
# 2. Builds Docker images
# 3. If all pass ✅ → Auto-deploy to VPS
# 4. Zero-downtime rolling deployment
```

**Status**: ✅ Working (check `.github/workflows/deploy.yml`)

**Requires**: GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`

---

### 2️⃣ Obsidian Brain → VPS Knowledge Base

**What it does**: Auto-sync your notes to VPS for AI agents

```bash
# Just edit and commit!
# Changes to empire-ops/EMPIRE-Vault/*.md trigger auto-sync

git add empire-ops/EMPIRE-Vault/Models.md
git commit -m "update: add new LLM pricing"
git push origin main

# Behind the scenes:
# 1. Detects .md file changes
# 2. Builds brain.json (120 most-recent notes)
# 3. Uploads to VPS
# 4. Restarts services
# 5. Commits brain.json back to repo
```

**Status**: ✅ Workflow ready (`.github/workflows/sync-obsidian-brain.yml`)

**Manual sync** (if needed):
```bash
./empire-sync/sync-obsidian.sh
```

**Vault location**: `empire-ops/EMPIRE-Vault/`

---

### 3️⃣ Verified System Status

**All three components**:
- ✅ CI workflow: `.github/workflows/ci.yml`
- ✅ Deploy workflow: `.github/workflows/deploy.yml`
- ✅ Brain sync workflow: `.github/workflows/sync-obsidian-brain.yml`
- ✅ Brain script: `empire-sync/sync-obsidian.sh`
- ✅ Obsidian vault: `empire-ops/EMPIRE-Vault/`
- ✅ VPS ready: Secrets configured

---

## Common Tasks

### Push code changes
```bash
git add apps/api/ apps/web/
git commit -m "feat: add new feature"
git push origin main
# CI runs → Deploy runs → VPS updated ✅
```

### Update knowledge base
```bash
# Edit in Obsidian (outside this repo) or direct edit:
echo "New info" >> empire-ops/EMPIRE-Vault/Models.md

git add empire-ops/EMPIRE-Vault/
git commit -m "update: fresh model info"
git push origin main
# Brain sync runs → brain.json updated → VPS updated ✅
```

### Check deployment status
```bash
# In browser:
https://github.com/RolandGasparyan/6-empires-os/actions

# Or CLI:
gh run list --workflow=deploy.yml --limit=5
```

### Force redeploy (if needed)
```bash
# Trigger manually on GitHub Actions:
1. Actions → "Deploy to VPS"
2. Run workflow → Select branch → main
3. Run

# Or via CLI:
gh workflow run deploy.yml --ref main
```

### Emergency rollback
```bash
# On GitHub, revert the commit:
git revert <commit-hash> && git push origin main

# CI runs → Deploy runs → VPS rolls back ✅
```

---

## Monitoring

### Live deployment logs
```bash
# Get run ID:
RUNID=$(gh run list --workflow=deploy.yml --limit=1 | awk '{print $7}')

# Watch logs:
gh run view $RUNID --log
```

### Check VPS
```bash
ssh -i ~/.ssh/empire_vps root@6-empires.com

# Docker status:
docker compose -f config/docker-compose.prod.yml ps

# Logs:
docker compose -f config/docker-compose.prod.yml logs -f

# Brain status:
python3 -c "import json; b=json.load(open('/opt/empire-sync/brain.json')); print(f'Brain: {b[\"noteCount\"]} notes, updated {b[\"updated\"]}')"
```

### Test endpoints
```bash
curl https://6-empires.com/health
curl https://6-empires.com/api/
```

---

## Troubleshooting

| Problem | Check | Fix |
|---------|-------|-----|
| Deploy not triggering | CI workflow passed? | Check CI logs in Actions |
| CI failing | Read test output | Fix failing tests, push again |
| VPS down | SSH to server | Check Docker logs |
| Brain.json not updated | Changed .md files? | Push to main branch |
| Old code still running | Check deploy log | Manual redeploy |

---

## Links

- **Full docs**: [`docs/SYNC-SYSTEM.md`](../docs/SYNC-SYSTEM.md)
- **GitHub Actions**: https://github.com/RolandGasparyan/6-empires-os/actions
- **VPS Dashboard**: SSH to 6-empires.com (requires key)
- **Obsidian Vault**: `empire-ops/EMPIRE-Vault/`

---

**TL;DR**: Push to main → CI runs → Deploy runs → VPS updated ✅ + Brain synced 🧠
