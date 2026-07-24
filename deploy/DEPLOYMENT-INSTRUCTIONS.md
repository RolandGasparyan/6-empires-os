# EMPIRE AI — VPS Deployment Instructions

**Target:** 64.227.6.197  
**Latest Commit:** `bd9599b330a8661f330d773723c6be48245eb4d4`  
**Status:** Ready for deployment

---

## Step 1: Trigger Deployment Workflow

### Via GitHub UI (Recommended)

1. **Go to:** https://github.com/RolandGasparyan/6-empires-os/actions/workflows/deploy.yml

2. **Click:** "Run workflow" button (top right)

3. **Enter deployment SHA:**
   ```
   bd9599b330a8661f330d773723c6be48245eb4d4
   ```

4. **Click:** "Run workflow"

5. **Monitor:** Deployment progress in Actions tab
   - Expected duration: 2-3 minutes
   - Watch for SSH connection and deployment script execution

### Workflow Steps

The deploy workflow will:
1. ✅ Verify commit passed CI
2. ✅ SSH to VPS (64.227.6.197)
3. ✅ Fetch latest code from main
4. ✅ Reset to verified commit
5. ✅ Run deploy-release.sh script
6. ✅ Restart services
7. ✅ Verify deployment

---

## Step 2: Monitor Deployment

### In GitHub Actions

```
https://github.com/RolandGasparyan/6-empires-os/actions/workflows/deploy.yml
```

Watch for:
- ✅ "Verify release SHA passed CI" — GREEN
- ✅ "Deploy via SSH" — RUNNING (blue)
- ✅ Final status — SUCCESS (green)

### SSH to VPS During Deployment

```bash
ssh root@64.227.6.197

# Check deployment in progress
ps aux | grep -i deploy
# or
ps aux | grep -i bash

# View real-time logs
journalctl -u empire-ai -f
```

---

## Step 3: Verify Deployment

### Post-Deployment Checks (SSH to VPS)

```bash
ssh root@64.227.6.197
```

#### Check 1: Service Status
```bash
systemctl status empire-ai
# Expected: active (running)

systemctl status nginx
# Expected: active (running)
```

#### Check 2: Recent Logs
```bash
journalctl -u empire-ai -n 20 --no-pager
# Expected: No errors, "Listening on 127.0.0.1:8090"
```

#### Check 3: Health Endpoint
```bash
curl -s http://127.0.0.1:8090/api/health | jq .
# Expected: {"status":"ok","models":[...]}
```

#### Check 4: Current Commit
```bash
cd /opt/empire-ai-chat
git log --oneline -1
# Expected: bd9599b Revert "chore(deploy)..."
```

#### Check 5: Chat Endpoint
```bash
TOKEN=$(grep CHAT_ACCESS_TOKEN /opt/empire-ai-chat/.env | cut -d= -f2)

curl -X POST http://127.0.0.1:8090/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"empire-prime","mode":"empire","messages":[{"role":"user","content":"hello"}]}' \
  2>&1 | head -c 200

# Expected: Chat response (JSON with text)
```

#### Check 6: Environment Check
```bash
cat /opt/empire-ai-chat/.env | grep -E "PORT|CHAT_LISTEN_HOST|EMPIRE_MODEL|OLLAMA"
# Expected: All critical vars set
```

---

## Step 4: Browser Testing

### Test Chat Application

**URL:** https://6-empires.com/chat

#### Test 1: Text Chat
```
1. Type: "Hello, what is your name?"
2. Expected: AI responds with name/greeting
3. Response should stream in (word by word)
```

#### Test 2: Message History
```
1. Send several messages
2. Expected: All visible in chat history
3. Context maintained across messages
```

#### Test 3: Agent Selection (if multi-agent)
```
1. Check if agent sidebar visible
2. Try switching between agents
3. Verify responses change per agent
```

#### Test 4: Input Methods
```
1. Test text input ✓
2. Test quick prompts (if available) ✓
3. Test message send (Enter/Button) ✓
```

---

## Step 5: Voice Chat Setup (Optional)

Voice chat requires manual Groq API key configuration:

### 5A: Get Groq API Key

1. Go to: https://console.groq.com/keys
2. Click "Create API Key"
3. Name it (e.g., "EMPIRE Voice Chat")
4. Copy the key (format: `gsk_...`)

### 5B: Configure on VPS

```bash
ssh root@64.227.6.197

# Edit .env file
nano /opt/empire-ai-chat/.env

# Find line:
# FREE_GROQ_KEY=__CHANGE_ME__

# Replace with your key:
# FREE_GROQ_KEY=gsk_your_actual_key_here

# Save: Ctrl+X, Y, Enter

# Restart service
systemctl restart empire-ai

# Verify
sleep 2
systemctl status empire-ai
journalctl -u empire-ai -n 5
```

### 5C: Test Voice Chat

```
1. Open: https://6-empires.com/chat
2. Click microphone icon 🎤
3. Say: "Hello" or "Ինչ ես կարծում" (Armenian)
4. Expected:
   - Speech transcribed to text
   - Message auto-sent
   - Response received
   - Audio plays (TTS)
```

---

## Troubleshooting

### If deployment fails:

```bash
# Check deployment logs
ssh root@64.227.6.197
journalctl -u empire-ai -n 50

# Common issues:
# 1. Port already in use: lsof -i :8090
# 2. Service won't start: Check .env file
# 3. Out of disk space: df -h
# 4. Git clone fails: Check network: ping github.com
```

### If chat doesn't respond:

```bash
# Check Ollama
systemctl status ollama
curl -s http://127.0.0.1:11434/api/tags | jq .

# Check Node.js server
curl -s http://127.0.0.1:8090/api/health | jq .

# Restart service
systemctl restart empire-ai
sleep 2
curl -s http://127.0.0.1:8090/api/health | jq .
```

### If voice doesn't work:

```bash
# Check Groq key is set
grep FREE_GROQ_KEY /opt/empire-ai-chat/.env | grep -v __CHANGE

# Test STT endpoint
TOKEN=$(grep CHAT_ACCESS_TOKEN /opt/empire-ai-chat/.env | cut -d= -f2)
# (requires audio file for full test)

# Check Piper TTS
test -x /opt/piper-hy/piper/piper && echo "Piper OK" || echo "Piper missing"
test -f /opt/piper-hy/hy_AM-gor-medium.onnx && echo "Model OK" || echo "Model missing"
```

---

## Post-Deployment Checklist

- [ ] GitHub Actions workflow shows SUCCESS
- [ ] SSH to VPS successful
- [ ] empire-ai service status: active (running)
- [ ] Health endpoint responds: {"status":"ok"}
- [ ] Chat endpoint works: sends message, gets response
- [ ] https://6-empires.com/chat loads
- [ ] Text chat responds to messages
- [ ] (Optional) Voice chat works with Groq key

---

## Configuration Backup

All settings saved in scratchpad:
- DEPLOYMENT-INSTRUCTIONS.md (this file)
- CONFIGURATION-BACKUP.md (environment vars)
- VPS-DEPLOYMENT-CHECKLIST.md (verification)
- DEPLOYMENT-LOGS-PARSER.md (log analysis)

---

## Support

### Quick Reference

| Component | Check | Command |
|-----------|-------|---------|
| Service | Status | `systemctl status empire-ai` |
| Health | Endpoint | `curl -s http://127.0.0.1:8090/api/health` |
| Logs | Recent | `journalctl -u empire-ai -n 20` |
| Commit | Version | `cd /opt/empire-ai-chat && git log -1` |
| Config | Vars | `cat /opt/empire-ai-chat/.env` |

### Contact

For issues, check:
1. Service logs: `journalctl -u empire-ai -f`
2. GitHub Actions: Workflow run details
3. VPS resources: `df -h` and `free -h`
4. Network: `ping -c 1 8.8.8.8`

---

**Deployment Ready** ✅  
**Target Commit:** bd9599b330a8661f330d773723c6be48245eb4d4  
**VPS:** 64.227.6.197  
**Application:** EMPIRE AI Chat + Voice  
