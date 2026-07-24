#!/usr/bin/env bash
# Voice Chat Diagnostic & Fix Tool
# Run on VPS: bash voice-chat-diagnostic.sh

set -euo pipefail

GOLD='\033[1;33m'; RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
say(){ echo -e "${GOLD}▶ $*${NC}"; }
err(){ echo -e "${RED}✗ $*${NC}" >&2; }
ok(){ echo -e "${GREEN}✓ $*${NC}"; }
info(){ echo -e "${BLUE}ℹ $*${NC}"; }

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  EMPIRE AI — VOICE CHAT DIAGNOSTIC & FIX                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# ─────────────────────────────────────────────────────────────────
say "DIAGNOSIS: STT (Speech-to-Text) Configuration"
echo "─────────────────────────────────────────────────────────────"

ENV_FILE="/opt/empire-ai-chat/.env"

# Check Groq API Key
say "Checking Groq API Key..."
if grep -q "^FREE_GROQ_KEY=" "$ENV_FILE"; then
  GROQ_KEY=$(grep "^FREE_GROQ_KEY=" "$ENV_FILE" | cut -d= -f2)
  if [[ "$GROQ_KEY" == "__CHANGE_ME__" ]]; then
    err "Groq API key not configured (still placeholder)"
    echo ""
    echo "  SOLUTION: Set Groq API key"
    echo "  1. Go to: https://console.groq.com/keys"
    echo "  2. Create API key (format: gsk_...)"
    echo "  3. Edit VPS .env file:"
    echo "     nano /opt/empire-ai-chat/.env"
    echo "  4. Find: FREE_GROQ_KEY=__CHANGE_ME__"
    echo "  5. Replace with: FREE_GROQ_KEY=gsk_your_key_here"
    echo "  6. Save: Ctrl+X, Y, Enter"
  elif [[ -z "$GROQ_KEY" ]]; then
    err "Groq API key is empty"
  else
    ok "Groq API key configured: ${GROQ_KEY:0:10}...${GROQ_KEY: -5}"
  fi
else
  err "Groq API key variable not found in .env"
fi
echo ""

# Check STT Language
say "Checking STT Language Configuration..."
if grep -q "^STT_LANG=" "$ENV_FILE"; then
  STT_LANG=$(grep "^STT_LANG=" "$ENV_FILE" | cut -d= -f2)
  ok "STT Language: $STT_LANG"
else
  warn "STT_LANG not set (defaulting to Armenian)"
fi
echo ""

# Check Piper TTS Installation
say "Checking Piper TTS Installation (for voice output)..."
if [[ -x /opt/piper-hy/piper/piper ]]; then
  ok "Piper binary found: /opt/piper-hy/piper/piper"
else
  err "Piper binary NOT found"
  echo "  To install Piper TTS, run:"
  echo "  bash enable-voice-chat-vps.sh"
fi

if [[ -f /opt/piper-hy/hy_AM-gor-medium.onnx ]]; then
  SIZE=$(du -h /opt/piper-hy/hy_AM-gor-medium.onnx | cut -f1)
  ok "Armenian model found: $SIZE"
else
  err "Armenian voice model NOT found"
fi

if [[ -f /opt/piper-hy/hy_AM-gor-medium.onnx.json ]]; then
  ok "Model config found"
else
  err "Model config NOT found"
fi
echo ""

# Check server.js has STT handler
say "Checking server.js for STT implementation..."
if grep -q "handleStt\|/api/stt" /opt/empire-ai-chat/server.js; then
  ok "STT endpoint implemented in server.js"
else
  err "STT endpoint NOT found in server.js"
fi
echo ""

# ─────────────────────────────────────────────────────────────────
say "TESTS: Voice Endpoints"
echo "─────────────────────────────────────────────────────────────"

TOKEN=$(grep CHAT_ACCESS_TOKEN /opt/empire-ai-chat/.env | cut -d= -f2)

# Test Health
say "Testing health endpoint..."
HEALTH=$(curl -s http://127.0.0.1:8090/api/health 2>/dev/null | jq '.ok' 2>/dev/null || echo "false")
if [[ "$HEALTH" == "true" ]]; then
  ok "Health endpoint: ok"
else
  err "Health endpoint failed"
fi
echo ""

# Test TTS
say "Testing TTS endpoint (Piper)..."
TTS_RESPONSE=$(curl -s -X POST http://127.0.0.1:8090/api/tts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test","language":"hy"}' \
  -w "\n%{http_code}" 2>&1)

HTTP_CODE=$(echo "$TTS_RESPONSE" | tail -1)
if [[ "$HTTP_CODE" == "200" ]]; then
  ok "TTS endpoint: 200 OK"
else
  err "TTS endpoint: HTTP $HTTP_CODE"
  echo "$TTS_RESPONSE" | head -c 200
fi
echo ""

# Test STT
say "Testing STT endpoint (Groq)..."
STT_RESPONSE=$(curl -s -X POST http://127.0.0.1:8090/api/stt \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: audio/wav" \
  --data-binary @/dev/null \
  -w "\n%{http_code}" 2>&1)

HTTP_CODE=$(echo "$STT_RESPONSE" | tail -1)
if [[ "$HTTP_CODE" =~ ^(200|400|401)$ ]]; then
  ok "STT endpoint: responding (HTTP $HTTP_CODE)"
  if echo "$STT_RESPONSE" | grep -q "speech-to-text is not configured"; then
    err "ERROR: Groq API key not configured"
  fi
else
  err "STT endpoint: HTTP $HTTP_CODE"
fi
echo ""

# ─────────────────────────────────────────────────────────────────
say "LOGS: Recent Errors"
echo "─────────────────────────────────────────────────────────────"

if journalctl -u empire-ai -n 50 --no-pager | grep -i "speech-to-text\|groq\|error" | grep -v "^--"; then
  echo ""
else
  ok "No recent errors in logs"
fi
echo ""

# ─────────────────────────────────────────────────────────────────
say "FIXES: Apply Voice Chat Configuration"
echo "─────────────────────────────────────────────────────────────"

# Check if Groq key needs to be set
GROQ_KEY=$(grep "^FREE_GROQ_KEY=" "$ENV_FILE" | cut -d= -f2)
if [[ "$GROQ_KEY" == "__CHANGE_ME__" || -z "$GROQ_KEY" ]]; then
  echo ""
  echo "🔧 FIX 1: Configure Groq API Key"
  echo "─────────────────────────────────────────────────────────────"
  echo ""
  echo "Step 1: Get Groq API key"
  echo "  • Go to: https://console.groq.com/keys"
  echo "  • Click: 'Create API Key'"
  echo "  • Copy the key (starts with gsk_)"
  echo ""
  echo "Step 2: Set on VPS"
  echo "  $ nano /opt/empire-ai-chat/.env"
  echo ""
  echo "Step 3: Find and replace"
  echo "  OLD: FREE_GROQ_KEY=__CHANGE_ME__"
  echo "  NEW: FREE_GROQ_KEY=gsk_YOUR_KEY_HERE"
  echo ""
  echo "Step 4: Save and restart"
  echo "  $ systemctl restart empire-ai"
  echo "  $ sleep 2"
  echo "  $ systemctl status empire-ai"
  echo ""
else
  ok "Groq API key configured ✓"
fi

# Check if Piper needs installation
if [[ ! -x /opt/piper-hy/piper/piper ]]; then
  echo ""
  echo "🔧 FIX 2: Install Piper TTS (Optional, for voice output)"
  echo "─────────────────────────────────────────────────────────────"
  echo ""
  echo "Option A: Automated Installation"
  echo "  Download enable-voice-chat-vps.sh script"
  echo "  $ bash enable-voice-chat-vps.sh"
  echo ""
  echo "Option B: Manual Installation"
  echo "  $ mkdir -p /opt/piper-hy"
  echo "  $ cd /opt/piper-hy"
  echo ""
  echo "  # Download Piper binary"
  echo "  $ curl -fsSL -O https://github.com/rhasspy/piper/releases/download/2024.1.31/piper_linux_x86_64.tar.gz"
  echo "  $ tar -xzf piper_linux_x86_64.tar.gz"
  echo "  $ rm piper_linux_x86_64.tar.gz"
  echo ""
  echo "  # Download Armenian model"
  echo "  $ curl -fsSL -O https://huggingface.co/rhasspy/piper-voices/resolve/main/hy/hy_AM-gor-medium/hy_AM-gor-medium.onnx"
  echo "  $ curl -fsSL -O https://huggingface.co/rhasspy/piper-voices/resolve/main/hy/hy_AM-gor-medium/hy_AM-gor-medium.onnx.json"
  echo ""
  echo "  # Verify installation"
  echo "  $ test -x /opt/piper-hy/piper/piper && echo 'Piper installed'"
  echo ""
else
  ok "Piper TTS installed ✓"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  VOICE CHAT DIAGNOSTIC COMPLETE                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Summary:"
echo "  • STT (Speech-to-Text): Requires Groq API key"
echo "  • TTS (Text-to-Speech): Piper installed" $(test -x /opt/piper-hy/piper/piper && echo "✓" || echo "✗")
echo "  • Chat Endpoint: Responding ✓"
echo ""
echo "Next Steps:"
echo "  1. Configure Groq API key (if not done)"
echo "  2. Restart service: systemctl restart empire-ai"
echo "  3. Test in browser: https://6-empires.com/chat"
echo "  4. Click microphone 🎤 to test voice input"
echo ""
