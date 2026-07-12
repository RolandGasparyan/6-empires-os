# 🔗 EMPIRE GitHub Integration Setup Guide

## Overview
EMPIRE Assistant is now connected to your GitHub repositories with real-time bidirectional sync capabilities.

**Status:** ✅ READY TO ACTIVATE

---

## 🚀 Quick Start (3 Steps)

### Step 1: Create GitHub Personal Access Token
1. Go to: https://github.com/settings/tokens/new
2. Click: "Generate new token (classic)"
3. Set permissions:
   - ✅ `repo` (full control of private repositories)
   - ✅ `workflow` (update workflow files)
   - ✅ `admin:repo_hook` (manage webhooks)
4. Copy the token (you'll need it in Step 2)

### Step 2: Configure EMPIRE Integration
```bash
# Edit the config file
nano ~/.empire/github-sync.json

# Replace these placeholders:
# "github_token": "YOUR_TOKEN_HERE"
# "webhook_secret": "YOUR_WEBHOOK_SECRET"
```

### Step 3: Start Sync Daemon
```bash
# Make script executable
chmod +x scripts/github-sync-daemon.py

# Start the daemon
python3 scripts/github-sync-daemon.py

# Or run in background
nohup python3 scripts/github-sync-daemon.py > github-sync.log 2>&1 &
```

---

## 🔧 Configuration Details

### File Location
```
~/.empire/github-sync.json
```

### Configuration Options

| Setting | Value | Purpose |
|---------|-------|---------|
| `github_user` | RolandGasparyan | Your GitHub username |
| `github_token` | YOUR_TOKEN | API authentication |
| `sync_enabled` | true | Enable/disable syncing |
| `sync_direction` | bidirectional | Two-way or one-way sync |
| `sync_frequency` | real-time | Timing: real-time, hourly, daily |
| `sync_interval_seconds` | 300 | Sync every 5 minutes |
| `auto_commit` | true | Auto-commit changes |
| `webhook_secret` | SECRET | GitHub webhook verification |

### Supported Repositories
Currently configured for:
- ✅ **6-empires-os** (main repo)

To add more repos, edit the `repos` array in config:
```json
"repos": ["6-empires-os", "other-repo", "another-repo"]
```

---

## 📡 Real-Time Sync with Webhooks

### Option A: GitHub Webhook (Recommended)
For true real-time sync, set up GitHub webhooks:

1. Go to your repo: https://github.com/RolandGasparyan/6-empires-os/settings/hooks
2. Click: "Add webhook"
3. Configure:
   - **Payload URL:** `https://your-empire-server.com/github/webhook`
   - **Content type:** `application/json`
   - **Secret:** (paste your webhook secret from config)
   - **Events:** Push, Pull Request
   - ✅ Active
4. Click: "Add webhook"

### Option B: Polling (Default)
Daemon automatically syncs every 300 seconds (5 minutes).

---

## 📊 Sync Behavior

### On Push to GitHub
✅ EMPIRE automatically pulls latest changes  
✅ Updates local working directory  
✅ Refreshes all connected workspaces  

### On Local Changes
✅ EMPIRE detects file changes  
✅ Auto-commits with timestamp  
✅ Pushes to GitHub (if auto_push enabled)  

### Conflict Resolution
If conflicts occur:
- Auto-merge strategy: "auto" (keeps local on conflict)
- Manual: Requires user intervention
- Create PR: Opens PR for manual review

---

## 🔍 Monitoring Sync Status

### Check Sync Logs
```bash
# View real-time logs
tail -f github-sync.log

# Check sync status
cat ~/.empire/sync-status.json
```

### Monitor Daemon
```bash
# Check if daemon is running
ps aux | grep github-sync-daemon.py

# View daemon output
cat github-sync.log
```

---

## 🚨 Troubleshooting

### Issue: "Token authentication failed"
**Solution:** Verify token has correct permissions
```bash
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

### Issue: "Permission denied when pushing"
**Solution:** Ensure token has `repo` permission and branch protection is not blocking

### Issue: "Webhook not triggering"
**Solution:** 
1. Check webhook delivery: GitHub repo > Settings > Webhooks > Recent Deliveries
2. Verify secret matches configuration
3. Check server is accessible from GitHub

### Issue: "Conflict during merge"
**Solution:** 
1. Check `merge_strategy` setting
2. Create PR manually if needed
3. Review conflicting files

---

## 🛠️ Advanced Configuration

### Custom Commit Message
```json
"auto_commit_message": "🔄 EMPIRE sync - {timestamp} - {branch}"
```

### Notification Setup (Slack)
```json
"notifications": {
  "enable_slack": true,
  "slack_webhook": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "notify_on_sync": true,
  "notify_on_error": true
}
```

### Exclude Files from Sync
```json
"exclude_patterns": [
  ".env*",
  "node_modules/",
  "*.log",
  ".git/",
  "build/",
  "dist/"
]
```

---

## 📋 Sync Status Dashboard

Monitor your sync status:

```bash
# Show sync summary
cat ~/.empire/sync-status.json

# Real-time monitoring
watch -n 5 'cat ~/.empire/sync-status.json | jq .'
```

Expected output:
```json
{
  "last_sync": "2026-07-12T14:30:45.123Z",
  "status": "success",
  "repos_synced": [
    {
      "name": "6-empires-os",
      "status": "synced",
      "commits": 1,
      "files_changed": 3
    }
  ],
  "next_sync": "2026-07-12T14:35:45.123Z"
}
```

---

## 🔐 Security Notes

✅ Tokens are stored in `~/.empire/github-sync.json` (local only)  
✅ Webhook secret prevents unauthorized sync triggers  
✅ All commits are signed with your git user  
✅ Sensitive files excluded by default (.env, node_modules, etc.)  

⚠️ **Never commit GitHub tokens to git repositories**

---

## 📚 Integration APIs

### Sync Daemon Methods
```python
daemon = GitHubSyncDaemon()
daemon.sync_repo("repo-name")      # Sync single repo
daemon.sync_all_repos()             # Sync all repos
daemon.start_daemon(interval=300)   # Start daemon
daemon.stop_daemon()                # Stop daemon
```

### Available Webhooks
- `POST /github/webhook` - GitHub event handler
- `GET /sync/status` - Current sync status
- `POST /sync/force` - Force immediate sync
- `POST /sync/pause` - Pause auto-sync
- `POST /sync/resume` - Resume auto-sync

---

## ✅ Verification Checklist

- [ ] GitHub Personal Access Token created
- [ ] Token added to `~/.empire/github-sync.json`
- [ ] Webhook secret configured
- [ ] Sync daemon script is executable
- [ ] Daemon started successfully
- [ ] First sync completed without errors
- [ ] Changes propagate to GitHub
- [ ] Changes from GitHub pull locally

---

## 🚀 Next Steps

1. **Activate Integration**
   ```bash
   python3 scripts/github-sync-daemon.py
   ```

2. **Add More Repositories**
   - Edit `.empire/github-sync.json`
   - Add repo names to `repos` array

3. **Set Up Notifications**
   - Configure Slack/Discord webhooks
   - Enable notifications in config

4. **Monitor Dashboard**
   - Watch sync status in real-time
   - View sync logs and history

---

## 📞 Support

For issues or questions:
1. Check `github-sync.log` for error messages
2. Review troubleshooting section above
3. Verify configuration matches your setup
4. Test token permissions manually

**Status:** ✅ Integration Ready  
**Repos Connected:** 1 (6-empires-os)  
**Last Updated:** 2026-07-12  
**Next Sync:** Auto (every 5 minutes)

---

**🎯 EMPIRE GitHub Integration Active**
