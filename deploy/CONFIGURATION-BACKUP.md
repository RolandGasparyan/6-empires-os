# EMPIRE AI — Complete Configuration Backup

**Date:** 2026-07-24  
**Commit:** bd9599b330a8661f330d773723c6be48245eb4d4  
**Status:** Ready for deployment

---

## 1. Application Architecture

### Directory Structure
```
6-empires-os/
├── apps/
│   └── web/                          # Next.js frontend
│       ├── src/app/
│       │   ├── chat/page.tsx         # Chat UI
│       │   └── page.tsx              # Homepage
│       ├── package.json              # Dependencies
│       └── public/
│           ├── empire-emblem.png     # Logo
│           └── home-v6/              # v6 design assets
│
├── empire-ai-chat/                   # Node.js backend
│   ├── server.js                     # Express server (652 lines)
│   ├── index.html                    # Chat HTML
│   ├── .env.example                  # Config template
│   ├── INSTALL_ON_VPS.sh            # VPS setup script
│   └── package.json                  # Dependencies
│
├── deploy/
│   ├── scripts/
│   │   └── deploy-release.sh         # Deployment script
│   └── nginx/
│       └── conf.d/
│           └── 00-redirect.conf      # Nginx config
│
├── empire-sync/
│   └── brain.json                    # AI brain/personality
│
└── .github/workflows/
    ├── ci.yml                        # CI/CD pipeline
    ├── deploy.yml                    # VPS deployment
    └── sync-obsidian-brain.yml       # Brain sync
```

---

## 2. Environment Variables

### Application (.env.example)
```bash
# Server Config
PORT=8090
CHAT_LISTEN_HOST=127.0.0.1
OLLAMA_URL=http://127.0.0.1:11434
EMPIRE_MODEL=gemma3:1b

# Brain/Personality
ENABLE_PRIVATE_BRAIN=false
EMPIRE_BRAIN=/opt/empire-sync/brain.json

# Voice Chat (Piper TTS + Groq STT)
PIPER_BIN=/opt/piper-hy/piper/piper
PIPER_MODEL=/opt/piper-hy/hy_AM-gor-medium.onnx
PIPER_CONFIG=/opt/piper-hy/hy_AM-gor-medium.onnx.json
STT_LANG=hy
FREE_GROQ_KEY=__CHANGE_ME__  # Get from https://console.groq.com/keys

# Cloud Fallbacks (Optional)
OPENAI_API_KEY=
EMPIRE_ROUTER=
EMPIRE_KEY=

# Resource Limits
CHAT_JSON_BODY_BYTES=131072
CHAT_TTS_BODY_BYTES=16384
CHAT_STT_BODY_BYTES=10485760
CHAT_MAX_MESSAGES=24
CHAT_MAX_CONCURRENCY=4
CHAT_TTS_MAX_CONCURRENCY=2
CHAT_STT_MAX_CONCURRENCY=2
CHAT_BODY_TIMEOUT_MS=15000
CHAT_UPSTREAM_TIMEOUT_MS=60000
```

### VPS System Config
```bash
# After deployment on /opt/empire-ai-chat/.env:
PORT=8090
CHAT_LISTEN_HOST=127.0.0.1
OLLAMA_URL=http://127.0.0.1:11434
EMPIRE_MODEL=gemma3:1b

# Voice Chat Paths
PIPER_BIN=/opt/piper-hy/piper/piper
PIPER_MODEL=/opt/piper-hy/hy_AM-gor-medium.onnx
PIPER_CONFIG=/opt/piper-hy/hy_AM-gor-medium.onnx.json
STT_LANG=hy

# Groq API Key (Set manually after deployment)
# FREE_GROQ_KEY=gsk_...

# Access Token (Generated or provided)
CHAT_ACCESS_TOKEN=<32+ character token>
```

---

## 3. Server Configuration

### Node.js Server (server.js - 652 lines)

**Port:** 8090 (internal), 8090→/chat (nginx proxy)

**Endpoints:**
```
GET  /api/health              Health check
POST /api/chat                Chat inference
POST /api/tts                 Text-to-speech (Piper)
POST /api/stt                 Speech-to-text (Groq)
GET  /                        Chat UI (index.html)
```

**Routing:**
- Primary: Groq API (chat models)
- Secondary: OpenAI API
- Fallback: Local Ollama (llama, qwen, gemma)
- Last resort: EMPIRE router

**Features:**
- Streaming responses (token-by-token)
- Voice input/output (STT/TTS)
- Multi-model support
- Resource concurrency limits
- Request size validation
- Auth token verification

---

## 4. Frontend Configuration

### Web Chat App (React/Next.js)

**File:** apps/web/src/app/chat/page.tsx (5 lines, redirects to server)

**URL:** https://6-empires.com/chat

**Features:**
- Chat interface
- Voice input (microphone)
- Voice output (audio playback)
- Message history
- Multi-agent support (if enabled)
- Theme support (gold/obsidian)

**Proxy:**
- Nginx reverse proxy
- WebSocket support
- Streaming support
- Location: /chat on main domain

---

## 5. Deployment Configuration

### GitHub Actions Workflows

#### CI Workflow (.github/workflows/ci.yml)
**Triggers:** Push, Pull Request
**Jobs:**
1. API — lint, types, tests
2. Web — types, build
3. Workflows + secret scan

#### Deploy Workflow (.github/workflows/deploy.yml)
**Trigger:** Manual (`workflow_dispatch`)
**Input:** deploy_sha (commit to deploy)

**Process:**
1. Verify commit passed CI
2. SSH to VPS (64.227.6.197)
3. Fetch from main
4. Reset to commit
5. Run deploy-release.sh
6. Restart services

**Secrets Required:**
- `VPS_HOST`: 64.227.6.197
- `VPS_USER`: root
- `VPS_SSH_KEY`: Private SSH key
- `GROQ_API_KEY`: (Optional, for manual setup)

#### Brain Sync Workflow (.github/workflows/sync-obsidian-brain.yml)
**Trigger:** On demand or scheduled
**Purpose:** Sync brain.json from Obsidian vault
**Permissions:** contents:write (can push commits)

---

## 6. VPS Infrastructure

### System Setup (64.227.6.197)

**OS:** Ubuntu/Debian (x86_64)
**Services:**
- Ollama (local LLM runtime)
- Node.js 20 (chat server)
- nginx (reverse proxy)
- systemd (service management)

### Installed Components

#### Ollama
```bash
Command: ollama
URL: http://127.0.0.1:11434
Models: gemma3:1b (configurable)
```

#### Piper TTS
```bash
Location: /opt/piper-hy/piper/piper
Model: /opt/piper-hy/hy_AM-gor-medium.onnx
Config: /opt/piper-hy/hy_AM-gor-medium.onnx.json
Language: Armenian (Gorgia accent)
```

#### Node.js Server
```bash
Location: /opt/empire-ai-chat/
Service: empire-ai (systemd)
Port: 8090
Auto-restart: Yes
```

#### nginx
```bash
Config: /etc/nginx/sites-available/empire-ai
Enabled: /etc/nginx/sites-enabled/empire-ai
Proxy: http://127.0.0.1:8090
Location: /chat on 6-empires.com
SSL: Let's Encrypt (certbot)
```

### Systemd Service

**File:** `/etc/systemd/system/empire-ai.service`

```ini
[Unit]
Description=EMPIRE AI chat (with voice)
After=network.target ollama.service
Wants=ollama.service

[Service]
Type=simple
EnvironmentFile=/opt/empire-ai-chat/.env
WorkingDirectory=/opt/empire-ai-chat
ExecStart=/usr/bin/node /opt/empire-ai-chat/server.js
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

---

## 7. Chat Application Behavior

### Text Chat Flow
```
User Input
    ↓
Frontend (page.tsx)
    ↓
POST /api/chat
    ↓
server.js → answerChat()
    ↓
Try: Groq API
    ↓ (if fail)
Try: OpenAI API
    ↓ (if fail)
Try: EMPIRE router
    ↓ (if fail)
Fallback: Ollama (local)
    ↓
Stream response (token by token)
    ↓
Display in UI
```

### Voice Input Flow (STT)
```
User clicks 🎤
    ↓
Browser records audio
    ↓
POST /api/stt (audio/wav)
    ↓
server.js → handleStt()
    ↓
Send to Groq Whisper API
    ↓
Receive: {"text": "transcribed text"}
    ↓
Populate input field
    ↓
Auto-send message
```

### Voice Output Flow (TTS)
```
Chat response received
    ↓
Check TTS enabled
    ↓
POST /api/tts (text)
    ↓
server.js → handleTts()
    ↓
Primary: Piper (local)
    ↓ (if fail)
Fallback: Azure (if key available)
    ↓
Receive: audio/wav
    ↓
Play in browser
    ↓
User hears response
```

---

## 8. Authentication & Security

### Chat Access Token
- Location: `/opt/empire-ai-chat/.env` → `CHAT_ACCESS_TOKEN`
- Format: 32+ character string (recommended: UUID v4 or random hash)
- Usage: `Authorization: Bearer <token>` header
- Purpose: Protect chat endpoints from unauthorized access

### API Key Management
- Groq API Key: Stored in .env, NOT in repo
- Groq Console: https://console.groq.com/keys
- Rotation: Can be changed anytime
- Rate Limit: Free tier 7,000 requests/month

### GitHub Secrets
- `VPS_HOST`: IP/hostname
- `VPS_USER`: SSH username
- `VPS_SSH_KEY`: Encrypted private key
- `GROQ_API_KEY`: Can be added for automated injection (currently manual)

---

## 9. Resource Constraints

### VPS Hardware
```
CPU: Shared (varies)
RAM: Varies (2-4GB typical)
Disk: ~100GB
Network: 1Gbps
```

### Application Limits
```
Max JSON body: 128KB
Max TTS audio: 16KB (output)
Max STT audio: 10MB (input, ~2hrs)
Max concurrent: 4 chat + 2 TTS + 2 STT
Timeout: 15s body, 60s upstream
```

### API Rate Limits
```
Groq (Free): 7,000 requests/month (~230/day)
OpenAI: Per API plan
Ollama: No limit (local)
```

---

## 10. Voice Chat Components

### Speech-to-Text (STT)
- **Provider:** Groq API
- **Model:** Whisper-Large-V3
- **Speed:** ~1 second per request
- **Cost:** Free tier included
- **Languages:** 99+ (Armenian supported)
- **Setup:** Requires FREE_GROQ_KEY in .env

### Text-to-Speech (TTS)
- **Primary:** Piper (local)
  - Model: Armenian (Gorgia) medium
  - Speed: ~1-5 seconds per utterance
  - Quality: Good for Armenian
  - Privacy: No external calls
  - Cost: Free (local)

- **Fallback:** Azure Cognitive Services
  - Requires: AZURE_SPEECH_KEY
  - Setup: Optional
  - Cost: Per request

---

## 11. Backup & Recovery

### Critical Files to Backup
```
/opt/empire-ai-chat/.env              # Configuration
/opt/empire-ai-chat/server.js         # Application
/etc/systemd/system/empire-ai.service # Service config
/etc/nginx/sites-available/empire-ai  # Nginx config
```

### Brain Backup
```
/opt/empire-sync/brain.json           # AI personality
(synced via GitHub Actions)
```

### Piper TTS Backup
```
/opt/piper-hy/piper/                  # Binary
/opt/piper-hy/*.onnx                  # Models
/opt/piper-hy/*.json                  # Configs
```

---

## 12. Monitoring & Logs

### Service Logs
```bash
journalctl -u empire-ai -f             # Real-time
journalctl -u empire-ai -n 100         # Last 100 lines
journalctl -u empire-ai --since 1h     # Last hour
```

### Log Locations
```
/var/log/journal/                      # Systemd logs
/opt/empire-ai-chat/logs/              # App logs (if created)
```

### Key Log Patterns
```
"Listening on 127.0.0.1:8090"         ✓ Server started
"chat request from"                    ✓ Chat activity
"STT request"                          ✓ Voice input
"TTS synthesis"                        ✓ Voice output
"Error:"                               ✗ Problem
"not configured"                       ✗ Missing config
```

---

## 13. Maintenance Schedule

### Daily
- Monitor: Service status, error logs
- Check: Groq API usage (vs 7K/month limit)

### Weekly
- Review: Performance metrics
- Update: Brain.json from Obsidian (if needed)

### Monthly
- Backup: Configuration files
- Verify: All endpoints responding
- Test: Voice chat functionality

### As Needed
- Rotate: API keys (security)
- Update: Models (Ollama, Piper)
- Patch: OS/dependencies

---

## 14. Troubleshooting Reference

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Connection refused" | Server not running | `systemctl restart empire-ai` |
| "speech-to-text not configured" | GROQ_API_KEY missing | Set in .env |
| 401 Unauthorized | Invalid token | Check CHAT_ACCESS_TOKEN |
| Slow TTS | Piper CPU bottleneck | Normal, ~50% CPU |
| High latency STT | Groq rate limit | Check quota, wait or upgrade |
| 502 Bad Gateway | nginx→8090 connection | Check: `lsof -i :8090` |
| Out of memory | Resource limit hit | Restart, reduce concurrency |
| No audio output | TTS endpoint fail | Check logs: `journalctl -u` |

---

## 15. Next Steps After Deployment

1. **Verify deployment successful** (all checks pass)
2. **Test text chat** (messages get responses)
3. **Setup voice chat** (if desired):
   - Get Groq API key from console.groq.com/keys
   - Set FREE_GROQ_KEY in .env
   - Restart service
4. **Test voice input** (microphone → transcribe)
5. **Test voice output** (response → audio)
6. **Monitor Groq usage** (console.groq.com/account/billing)
7. **Document any customizations**

---

**Configuration Complete** ✅  
**All systems documented and ready for deployment**  
**Target Commit:** bd9599b330a8661f330d773723c6be48245eb4d4  
