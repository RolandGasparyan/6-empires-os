# 6-EMPIRE Sync System

**Purpose**: Synchronize GitHub code, VPS server, and Obsidian knowledge base into a unified, always-in-sync system.

**Status**: Complete end-to-end sync pipeline operational.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    6-EMPIRE Sync System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Developer  ──push──>  GitHub  ──CI─────┐                      │
│                         (main)          │                      │
│                           │             ├──→  VPS Deployment   │
│                           │             │     (auto-deploy)    │
│                      Obsidian Brain  ───┘                      │
│                      Sync Workflow                              │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   GitHub Repo    │  │   VPS Server     │  │  Obsidian    │ │
│  │  (Code + Brain)  │  │  (Live Apps)     │  │  Vault       │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component 1: GitHub Project Sync

### What it does
- Runs CI tests on every push to `main` or `claude/**` branches
- Validates Python API, TypeScript Web, and builds Docker images
- Automatically triggers deployment pipeline on success

### Workflow location
`.github/workflows/ci.yml`

### How to trigger
```bash
git push origin main
```

### Status check
- View in GitHub: Actions → CI workflow
- Look for green checkmark ✅ on your commits

---

## Component 2: VPS Server Auto-Deployment

### What it does
- Deploys code to `6-empires.com` automatically after CI passes
- Performs zero-downtime rolling deployment
- Rebuilds Docker containers and restarts services
- Waits for API health check before marking complete

### Workflow location
`.github/workflows/deploy.yml`

### Prerequisites
Three GitHub secrets must be set in Settings → Secrets → Actions:
- `VPS_HOST`: Server hostname (e.g., 64.227.6.197 or 6-empires.com)
- `VPS_USER`: SSH username (e.g., root)
- `VPS_SSH_KEY`: Private SSH key with access to VPS

### Deployment process
1. Developer pushes to `main` branch
2. CI workflow runs (tests, builds, etc.)
3. If CI passes ✅, deploy workflow triggers
4. Workflow SSH's to VPS and runs:
   ```bash
   git fetch origin main
   git reset --hard origin/main
   docker compose -f config/docker-compose.prod.yml build api web
   docker compose -f config/docker-compose.prod.yml up -d --remove-orphans
   ```
5. Workflow waits for API health check (max 2 minutes)
6. Deployment marked complete

### Rollback
If deployment fails:
```bash
ssh -i ~/.ssh/empire_vps root@6-empires.com
cd ~/6-empires-os
git reset --hard HEAD~1  # Go back one commit
docker compose -f config/docker-compose.prod.yml up -d --remove-orphans
```

### Verify deployment
```bash
# Check VPS logs
ssh -i ~/.ssh/empire_vps root@6-empires.com
docker compose -f config/docker-compose.prod.yml logs -f api

# Test API endpoint
curl https://6-empires.com/health
```

---

## Component 3: Obsidian Brain Sync

### What it does
- Reads your Obsidian Second Brain vault (`empire-ops/EMPIRE-Vault/`)
- Builds a `brain.json` file with up to 120 most-recent notes
- Syncs to VPS at `/opt/empire-sync/brain.json`
- Restarts services to load latest knowledge base
- Commits updated `brain.json` back to GitHub repo

### Vault location
`empire-ops/EMPIRE-Vault/` (already in this repo)

### How syncing works

#### Automatic sync (GitHub Actions)
- **Trigger**: Push changes to `.md` files in `empire-ops/EMPIRE-Vault/`
- **Workflow**: `.github/workflows/sync-obsidian-brain.yml`
- **Steps**:
  1. Detect changes to Obsidian vault
  2. Build `brain.json` with most-recent notes
  3. Upload to VPS via SCP
  4. Restart services
  5. Commit updated brain.json to repo

#### Manual sync (Local script)
- **Script**: `empire-sync/sync-obsidian.sh`
- **Run**: `./empire-sync/sync-obsidian.sh`
- **Prerequisites**:
  - macOS (currently configured for Mac path)
  - SSH key at `~/.ssh/empire_vps`
  - VPS host configured in script

### Brain prioritization
Notes are ranked by:
1. **Priority tier** (metadata, infrastructure docs always included)
2. **Recency** (newest notes take precedence)
3. **Character limit** (1800 chars max per note to stay bounded)

Priority titles:
- Infrastructure
- EMPIRE OS
- EMPIRE AI Chat
- Free LLM APIs
- God Mode Prompts
- Models
- OpenHuman
- Pending Actions

### Brain.json structure
```json
{
  "source": "6-EMPIRE Second Brain (GitHub + Obsidian)",
  "repository": "RolandGasparyan/6-empires-os",
  "branch": "main",
  "commit": "abc123def...",
  "noteCount": 120,
  "maxNotes": 120,
  "maxCharsPerNote": 1800,
  "updated": "2026-07-12T15:30:00.000Z",
  "notes": [
    {
      "title": "EMPIRE OS",
      "text": "..."
    },
    ...
  ]
}
```

### How AI agents use the brain
1. Every request to VPS loads latest `brain.json`
2. Agent picks most relevant notes based on query
3. Notes are injected into prompt context
4. Agent responds with knowledge-grounded answers

### Testing brain sync
```bash
# View current brain
curl https://6-empires.com/api/brain | jq .noteCount

# Manually trigger sync (in GitHub)
1. Go to Actions → "Sync Obsidian Brain to VPS"
2. Click "Run workflow"
3. Select branch: main
4. Click "Run workflow"

# Verify on VPS
ssh -i ~/.ssh/empire_vps root@6-empires.com
python3 -c "import json; b=json.load(open('/opt/empire-sync/brain.json')); print(f'{b[\"noteCount\"]} notes')"
```

---

## Complete Flow

### Scenario: You update notes + push code
```
1. Edit notes in Obsidian (e.g., "Models.md")
2. Commit to repo: git add empire-ops/EMPIRE-Vault/Models.md && git commit
3. Push to main: git push origin main

Results:
├─ CI workflow runs (tests, builds)
├─ If CI passes → Deploy workflow runs
│  ├─ Code deployed to VPS
│  └─ Services restarted
└─ Brain sync workflow runs
   ├─ brain.json built with your updated notes
   ├─ Synced to VPS
   └─ Services restart with latest knowledge
```

### Scenario: CI fails (don't deploy)
```
1. Developer pushes to main
2. CI workflow runs
3. Tests fail ❌
4. Deploy workflow DOES NOT run (skipped)
5. Brain sync workflow DOES NOT run (skipped)

To fix:
1. Developer fixes code
2. Pushes new commit
3. CI runs again
4. If CI passes ✅, everything deploys
```

### Scenario: You need to roll back
```
1. On GitHub, revert the problematic commit
   git revert <commit-hash> && git push origin main

2. CI runs on revert commit
3. If CI passes, deploy workflow triggers
4. VPS rolls back to previous commit
5. Brain.json reverts too
```

---

## Monitoring & Debugging

### Check all workflows
```bash
# GitHub Actions
gh workflow list

# Or in browser
https://github.com/RolandGasparyan/6-empires-os/actions
```

### Check specific workflow status
```bash
gh run list --workflow=ci.yml
gh run list --workflow=deploy.yml
gh run list --workflow=sync-obsidian-brain.yml
```

### View workflow logs
```bash
# Get recent run ID
gh run list --workflow=deploy.yml --limit=1

# View logs
gh run view <run-id> --log
```

### Debug VPS deployment issues
```bash
# SSH to VPS
ssh -i ~/.ssh/empire_vps root@6-empires.com

# Check Docker status
docker compose -f config/docker-compose.prod.yml ps

# Check logs
docker compose -f config/docker-compose.prod.yml logs -f

# Check API health
curl http://localhost:8000/health

# Check brain.json
ls -lh /opt/empire-sync/brain.json
python3 -c "import json; b=json.load(open('/opt/empire-sync/brain.json')); print(f'{b[\"noteCount\"]} notes, last updated {b[\"updated\"]}')"
```

### Troubleshooting

#### Deploy workflow not triggering
- Check: Does CI workflow pass? (required to trigger deploy)
- Check: GitHub Secrets set correctly? (VPS_HOST, VPS_USER, VPS_SSH_KEY)
- Check: Are you pushing to `main` branch?

#### Brain sync not happening
- Check: Did you change `.md` files in `empire-ops/EMPIRE-Vault/`?
- Check: Did you push to `main` branch?
- Check: Did CI workflow pass first?
- Manual trigger: Go to Actions → "Sync Obsidian Brain to VPS" → "Run workflow"

#### VPS still running old code
- Check if deployment failed: View deploy workflow logs
- Manual deploy:
  ```bash
  ssh -i ~/.ssh/empire_vps root@6-empires.com
  cd ~/6-empires-os && git pull origin main
  docker compose -f config/docker-compose.prod.yml up -d --remove-orphans
  ```

---

## Configuration

### GitHub Secrets Required
Set these in: Settings → Secrets and variables → Actions

| Secret | Example | Purpose |
|--------|---------|---------|
| VPS_HOST | 64.227.6.197 | IP or hostname of VPS |
| VPS_USER | root | SSH username for VPS |
| VPS_SSH_KEY | (private key) | SSH private key for passwordless auth |

### VPS Prerequisites
The VPS must have:
- Docker & Docker Compose
- SSH access via public key auth
- `/opt/empire-sync/` directory (created by first sync)
- `systemctl` with `empire-ai` service (optional, for restart)

### Obsidian Vault
Must contain `.md` files in `empire-ops/EMPIRE-Vault/`:
```
empire-ops/EMPIRE-Vault/
├── EMPIRE AI Chat.md
├── EMPIRE OS.md
├── Infrastructure.md
├── Models.md
├── Pending Actions.md
└── .obsidian/  # Obsidian settings (ignored in brain.json)
```

---

## Future Enhancements

- [ ] Obsidian Sync API integration (cloud-native vault syncing)
- [ ] Brain search API (full-text index of notes)
- [ ] Automated note linking (cross-reference Obsidian links in brain)
- [ ] Scheduled syncs at fixed intervals (vs. only on push)
- [ ] Brain diffs and change tracking
- [ ] Multi-vault support (consolidate multiple Obsidian vaults)

---

## Related Documentation

- **CI/CD Architecture**: See `.github/workflows/` directory
- **VPS Deployment**: See `config/docker-compose.prod.yml`
- **Obsidian Vault**: See `empire-ops/EMPIRE-Vault/`
- **Brain Consolidation**: See `empire-sync/consolidate_second_brain.py`
- **Operating Manual**: See `docs/OPERATING-MANUAL.md`

