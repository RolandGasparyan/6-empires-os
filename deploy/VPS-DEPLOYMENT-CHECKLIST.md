# VPS Deployment Checklist

**VPS:** 64.227.6.197  
**Date Deployed:** _______________  
**Deployment Commit:** bd9599b330a8661f330d773723c6be48245eb4d4  

---

## Phase 1: Pre-Deployment (Before Triggering Workflow)

### GitHub Secrets Verification
- [ ] `VPS_HOST` = 64.227.6.197
- [ ] `VPS_USER` = root
- [ ] `VPS_SSH_KEY` = valid SSH private key
- [ ] All secrets are properly configured

### Commit Status
- [ ] Latest commit: bd9599b330a8661f330d773723c6be48245eb4d4
- [ ] Commit message: "Revert chore(deploy)..." ✓
- [ ] CI passed on commit (check Actions)
- [ ] No uncommitted changes in repo

### Workflow Configuration
- [ ] `.github/workflows/deploy.yml` restored ✓
- [ ] GROQ_API_KEY removed from workflow ✓
- [ ] Only DEPLOY_SHA in envs ✓
- [ ] Deployment script exists ✓

---

## Phase 2: During Deployment (GitHub Actions)

### Workflow Execution
- [ ] "Run workflow" triggered successfully
- [ ] Deployment SHA entered correctly
- [ ] Workflow started (visible in Actions tab)

### Step 1: Verify Release SHA
- [ ] ✅ "Verify release SHA passed CI" — SUCCESS
- [ ] SHA validation passed
- [ ] CI check passed
- [ ] No errors in this step

### Step 2: SSH Deploy
- [ ] ✅ "Deploy via SSH" — STARTED/RUNNING
- [ ] SSH connection established
- [ ] Script execution in progress
- [ ] Real-time output visible

### Step 3: Deployment Script
- [ ] Repository fetch successful
- [ ] Git reset to target commit
- [ ] deploy-release.sh executed
- [ ] No fatal errors reported

### Final Status
- [ ] Workflow completed: SUCCESS (green)
- [ ] Duration: ~2-3 minutes
- [ ] All steps passed
- [ ] Timestamp recorded

---

## Phase 3: Post-Deployment (SSH Verification)

### Initial Connection
```bash
ssh root@64.227.6.197
```
- [ ] SSH connection successful
- [ ] Shell prompt available
- [ ] User is root

### Service Status
```bash
systemctl status empire-ai
```
- [ ] Service: empire-ai
- [ ] Status: **active (running)** ✓
- [ ] No errors
- [ ] Memory usage reasonable

### Alternative Services
```bash
systemctl status nginx
systemctl status ollama
```
- [ ] nginx: **active (running)** ✓
- [ ] ollama: **active (running)** ✓
- [ ] No critical errors

### Recent Logs
```bash
journalctl -u empire-ai -n 20 --no-pager
```
- [ ] Last entries show recent start/restart
- [ ] No ERROR or FATAL in logs
- [ ] "Listening on 127.0.0.1:8090" message present
- [ ] Timestamps reasonable (within last 5 min)

### Health Check
```bash
curl -s http://127.0.0.1:8090/api/health | jq .
```
- [ ] HTTP 200 OK response
- [ ] JSON response: `{"status":"ok", ...}`
- [ ] Models array present
- [ ] No null/undefined values

### Deployment Verification
```bash
cd /opt/empire-ai-chat
git log --oneline -1
```
- [ ] Current commit: bd9599b
- [ ] Message: "Revert chore(deploy)..." ✓
- [ ] Correct commit deployed

### Configuration Check
```bash
cat /opt/empire-ai-chat/.env | head -20
```
- [ ] PORT=8090
- [ ] CHAT_LISTEN_HOST=127.0.0.1
- [ ] OLLAMA_URL=http://127.0.0.1:11434
- [ ] EMPIRE_MODEL=gemma3:1b (or configured)
- [ ] No __CHANGE_ME__ values in critical vars

### Chat Endpoint Test
```bash
TOKEN=$(grep CHAT_ACCESS_TOKEN /opt/empire-ai-chat/.env | cut -d= -f2)
curl -X POST http://127.0.0.1:8090/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"empire-prime","mode":"empire","messages":[{"role":"user","content":"test"}]}'
```
- [ ] HTTP 200 OK
- [ ] Response contains text/content
- [ ] No errors in response
- [ ] Authorization accepted

---

## Phase 4: Browser Testing

### Access Application
```
https://6-empires.com/chat
```
- [ ] Page loads successfully
- [ ] No 404 or 502 errors
- [ ] Chat interface visible
- [ ] Input field present

### Text Chat Test 1: Basic Message
```
Action: Type "Hello, test message"
Expected: Response within 5 seconds
```
- [ ] Message sent successfully
- [ ] Response received
- [ ] Response text visible
- [ ] No error messages

### Text Chat Test 2: Follow-up Message
```
Action: Type follow-up question
Expected: Context maintained
```
- [ ] Conversation history visible
- [ ] Both messages in chat
- [ ] Response acknowledges context
- [ ] No repeated information

### Text Chat Test 3: Armenian Message
```
Action: Type in Armenian: "Ինչ ես կարծում?"
Expected: Armenian response
```
- [ ] Message accepted
- [ ] Response received
- [ ] Response in Armenian
- [ ] Encoding correct (no garbled text)

### Quick Prompts (if available)
- [ ] Quick prompt buttons visible
- [ ] Clicking prompt sends message
- [ ] Response appropriate
- [ ] No formatting issues

### UI/UX Checks
- [ ] Chat scrolls smoothly
- [ ] Messages display properly
- [ ] Input field responsive
- [ ] No lag or freezing
- [ ] Responsive on different screen sizes

---

## Phase 5: Voice Chat Setup & Testing (Optional)

### Prerequisites
- [ ] Groq API key obtained from https://console.groq.com/keys
- [ ] Key format: starts with `gsk_`
- [ ] Key copied (won't be visible again)

### VPS Configuration
```bash
ssh root@64.227.6.197
nano /opt/empire-ai-chat/.env
# Find: FREE_GROQ_KEY=__CHANGE_ME__
# Replace with: FREE_GROQ_KEY=gsk_...
# Save: Ctrl+X, Y, Enter

systemctl restart empire-ai
sleep 2
systemctl status empire-ai
```
- [ ] .env edited successfully
- [ ] Service restarted
- [ ] Service status: active
- [ ] No errors in logs

### Voice Chat Test 1: TTS (Text-to-Speech)
```bash
TOKEN=$(grep CHAT_ACCESS_TOKEN /opt/empire-ai-chat/.env | cut -d= -f2)
curl -X POST http://127.0.0.1:8090/api/tts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Salam","language":"hy"}' \
  --output /tmp/test.wav

ls -lh /tmp/test.wav
```
- [ ] HTTP 200 OK
- [ ] WAV file created
- [ ] File size > 1000 bytes
- [ ] File is valid audio

### Voice Chat Test 2: STT (Speech-to-Text) - Browser
```
Action: https://6-empires.com/chat
         Click microphone 🎤
         Speak: "Hello" or "Ինչ ես"
         Wait for transcription
```
- [ ] Microphone permission requested
- [ ] Recording starts (mic icon active)
- [ ] Speaking detected
- [ ] Text appears in input field
- [ ] Transcription accurate

### Voice Chat Test 3: Voice Response
```
Action: Wait after message sends
Expected: Audio plays
```
- [ ] Response received (text visible)
- [ ] Speaker icon appears
- [ ] Audio plays (1-10 seconds for Piper)
- [ ] Voice is intelligible
- [ ] Language is Armenian (Gorgia accent)

### Voice Chat Test 4: Full Voice Cycle
```
Action: Click 🎤 → Speak question
        → Wait for transcription + response + audio
Expected: Complete flow succeeds
```
- [ ] Recording works
- [ ] Transcription accurate
- [ ] Message auto-sends
- [ ] Response received (text)
- [ ] Audio plays
- [ ] Full cycle takes <30 seconds

### Groq Usage Check
```bash
ssh root@64.227.6.197
# Check logs for Groq calls
journalctl -u empire-ai | grep -i groq
```
- [ ] Groq API calls visible in logs
- [ ] No rate limit errors
- [ ] No authentication errors
- [ ] Responses are successful

### Groq Quota Check
```
https://console.groq.com/account/billing/overview
```
- [ ] API usage < 7000 requests
- [ ] Current month usage visible
- [ ] Quota not exceeded
- [ ] Remaining quota > 0

---

## Phase 6: Performance Monitoring

### Response Times
- [ ] Text chat: < 5 seconds
- [ ] STT: < 2 seconds (Groq API)
- [ ] TTS: < 5 seconds (Piper)

### Resource Usage
```bash
ssh root@64.227.6.197
top -b -n 1 | head -20
free -h
df -h
```
- [ ] CPU: < 80% under normal load
- [ ] RAM: < 90% used
- [ ] Disk: > 10GB free
- [ ] No swap usage (or minimal)

### Network
```bash
ping -c 1 8.8.8.8
curl -I https://console.groq.com
```
- [ ] Internet connectivity good
- [ ] Groq API reachable
- [ ] No connection timeouts

### Service Stability
```bash
systemctl status empire-ai
```
- [ ] Service has been running (check "Active:")
- [ ] Restart count: 0 (or minimal)
- [ ] Memory stable (not growing continuously)
- [ ] No segfaults or crashes

---

## Phase 7: Security Verification

### Authentication
- [ ] Chat endpoints require Authorization header
- [ ] Invalid token returns 401
- [ ] Valid token grants access

### Network Security
- [ ] SSH only, no telnet/ftp
- [ ] HTTPS only (with cert)
- [ ] HTTP redirects to HTTPS
- [ ] No exposed ports (22, 8090, etc)

### Secrets Management
- [ ] CHAT_ACCESS_TOKEN not in logs
- [ ] GROQ_API_KEY not in logs
- [ ] No sensitive data in error messages
- [ ] .env file: 600 permissions (owner only)

### Firewall (if applicable)
- [ ] Only necessary ports open (80, 443)
- [ ] Port 8090 not exposed externally
- [ ] SSH restricted to known IPs (optional)

---

## Phase 8: Documentation & Backup

### Deployment Record
- [ ] This checklist completed and signed
- [ ] Deployment date recorded
- [ ] Final commit SHA verified
- [ ] Issues/notes documented

### Configuration Backup
- [ ] DEPLOYMENT-INSTRUCTIONS.md saved
- [ ] CONFIGURATION-BACKUP.md saved
- [ ] VPS-DEPLOYMENT-CHECKLIST.md (this file) saved
- [ ] All files in scratchpad

### Runbooks Created
- [ ] Service restart procedure documented
- [ ] Troubleshooting guide available
- [ ] Rollback procedure documented
- [ ] Escalation contacts recorded

---

## Phase 9: Final Verification

### All Critical Systems Green ✅
- [ ] Service running
- [ ] Health endpoint responding
- [ ] Text chat working
- [ ] Chat responding with relevant content
- [ ] No error messages in logs

### Voice Chat (if enabled) ✅
- [ ] TTS endpoint working
- [ ] STT endpoint accepting requests
- [ ] Groq API key configured
- [ ] Speech-to-text transcribing
- [ ] Text-to-speech playing audio

### Performance Acceptable ✅
- [ ] Response times < 5 seconds
- [ ] Resource usage normal
- [ ] No memory leaks
- [ ] Stable (no crashes/restarts)

---

## Sign-Off

**Deployment Status:** ✅ COMPLETE

**Deployed By:** _______________  
**Date:** _______________  
**Time:** _______________  
**Commit:** bd9599b330a8661f330d773723c6be48245eb4d4  

**Issues Found:** 
- [ ] None (all green)
- [ ] Minor (documented below)
- [ ] Major (requires fix)

**Notes:**
```
[Document any issues, customizations, or special observations]


```

**Next Actions:**
- [ ] Monitor logs for 24 hours
- [ ] Setup alerting (if available)
- [ ] Schedule next maintenance
- [ ] Update runbooks if needed

---

**Deployment Verified** ✅  
**System Operational** ✅  
**Ready for Production** ✅  
