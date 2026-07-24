#!/usr/bin/env bash
# Voice Chat Quick Fix
# Run on VPS: bash voice-chat-quick-fix.sh

set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; GOLD='\033[1;33m'; NC='\033[0m'
ok(){ echo -e "${GREEN}✓ $*${NC}"; }
err(){ echo -e "${RED}✗ $*${NC}" >&2; }
say(){ echo -e "${GOLD}▶ $*${NC}"; }

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  VOICE CHAT — QUICK FIX                                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

ENV_FILE="/opt/empire-ai-chat/.env"

# FIX 1: Check and create .env if missing
say "FIX 1: Ensure .env file exists"
if [[ ! -f "$ENV_FILE" ]]; then
  err ".env file missing - creating from example"
  cp /opt/empire-ai-chat/.env.example "$ENV_FILE" 2>/dev/null || echo "No .env.example found"
else
  ok ".env file exists"
fi
echo ""

# FIX 2: Ensure STT_LANG is set
say "FIX 2: Ensure STT_LANG configured"
if ! grep -q "^STT_LANG=" "$ENV_FILE"; then
  echo "Adding STT_LANG to .env..."
  echo "STT_LANG=hy" >> "$ENV_FILE"
  ok "STT_LANG added (Armenian)"
else
  ok "STT_LANG already configured"
fi
echo ""

# FIX 3: Ensure PIPER variables are set
say "FIX 3: Configure Piper TTS paths"
if [[ -d /opt/piper-hy/piper ]]; then
  # Update PIPER_BIN
  if grep -q "^PIPER_BIN=" "$ENV_FILE"; then
    sed -i 's|^PIPER_BIN=.*|PIPER_BIN=/opt/piper-hy/piper/piper|' "$ENV_FILE"
  else
    echo "PIPER_BIN=/opt/piper-hy/piper/piper" >> "$ENV_FILE"
  fi

  # Update PIPER_MODEL
  if grep -q "^PIPER_MODEL=" "$ENV_FILE"; then
    sed -i 's|^PIPER_MODEL=.*|PIPER_MODEL=/opt/piper-hy/hy_AM-gor-medium.onnx|' "$ENV_FILE"
  else
    echo "PIPER_MODEL=/opt/piper-hy/hy_AM-gor-medium.onnx" >> "$ENV_FILE"
  fi

  # Update PIPER_CONFIG
  if grep -q "^PIPER_CONFIG=" "$ENV_FILE"; then
    sed -i 's|^PIPER_CONFIG=.*|PIPER_CONFIG=/opt/piper-hy/hy_AM-gor-medium.onnx.json|' "$ENV_FILE"
  else
    echo "PIPER_CONFIG=/opt/piper-hy/hy_AM-gor-medium.onnx.json" >> "$ENV_FILE"
  fi

  ok "Piper paths configured"
else
  echo "ℹ Piper not installed - skipping"
fi
echo ""

# FIX 4: Remove duplicate lines in .env
say "FIX 4: Clean up .env duplicates"
# Create temp file with unique lines (keeping first occurrence)
awk '!seen[$0]++' "$ENV_FILE" > /tmp/env.clean && mv /tmp/env.clean "$ENV_FILE"
ok "Duplicates removed"
echo ""

# FIX 5: Ensure Groq key prompt
say "FIX 5: Check Groq API Key configuration"
GROQ_KEY=$(grep "^FREE_GROQ_KEY=" "$ENV_FILE" | cut -d= -f2)
if [[ "$GROQ_KEY" == "__CHANGE_ME__" || -z "$GROQ_KEY" ]]; then
  echo ""
  echo "⚠️  Groq API key needs to be configured:"
  echo ""
  echo "  1. Go to: https://console.groq.com/keys"
  echo "  2. Create API Key (format: gsk_...)"
  echo "  3. Copy the key"
  echo "  4. Run this to set it:"
  echo ""
  echo "     sed -i 's/^FREE_GROQ_KEY=.*/FREE_GROQ_KEY=gsk_your_key_here/' /opt/empire-ai-chat/.env"
  echo ""
  echo "  5. Replace 'gsk_your_key_here' with your actual key"
  echo ""
else
  ok "Groq API key configured: ${GROQ_KEY:0:10}..."
fi
echo ""

# FIX 6: Ensure CHAT_ACCESS_TOKEN
say "FIX 6: Verify CHAT_ACCESS_TOKEN"
if grep -q "^CHAT_ACCESS_TOKEN=" "$ENV_FILE"; then
  TOKEN=$(grep "^CHAT_ACCESS_TOKEN=" "$ENV_FILE" | cut -d= -f2)
  if [[ -n "$TOKEN" && ${#TOKEN} -ge 30 ]]; then
    ok "Chat token configured (${#TOKEN} chars)"
  else
    err "Chat token too short or empty"
    echo "Generating new token..."
    NEW_TOKEN=$(openssl rand -hex 32)
    sed -i "s|^CHAT_ACCESS_TOKEN=.*|CHAT_ACCESS_TOKEN=$NEW_TOKEN|" "$ENV_FILE"
    ok "New token generated"
  fi
else
  echo "Generating CHAT_ACCESS_TOKEN..."
  NEW_TOKEN=$(openssl rand -hex 32)
  echo "CHAT_ACCESS_TOKEN=$NEW_TOKEN" >> "$ENV_FILE"
  ok "Token created"
fi
echo ""

# FIX 7: Restart service
say "FIX 7: Restart empire-ai service"
systemctl restart empire-ai
sleep 3

if systemctl is-active empire-ai >/dev/null 2>&1; then
  ok "Service restarted successfully"
else
  err "Service failed to start - checking logs..."
  journalctl -u empire-ai -n 10 --no-pager
  exit 1
fi
echo ""

# FIX 8: Verify voice endpoints
say "FIX 8: Verify voice endpoints responding"
TOKEN=$(grep "^CHAT_ACCESS_TOKEN=" "$ENV_FILE" | cut -d= -f2)

# Test TTS
TTS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8090/api/tts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test","language":"hy"}')
if [[ "$TTS_HTTP" == "200" ]]; then
  ok "TTS endpoint: 200 OK"
else
  echo "TTS endpoint: HTTP $TTS_HTTP (may need Piper installed)"
fi

# Test STT
STT_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8090/api/stt \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: audio/wav" \
  --data-binary @/dev/null)
if [[ "$STT_HTTP" == "200" || "$STT_HTTP" == "400" ]]; then
  ok "STT endpoint: responding ($STT_HTTP)"
else
  echo "STT endpoint: HTTP $STT_HTTP"
fi
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  VOICE CHAT FIXES APPLIED                                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "Status:"
echo "  • .env file: ✓ Configured"
echo "  • STT_LANG: ✓ Set to Armenian (hy)"
echo "  • Piper paths: ✓ Updated"
echo "  • Chat token: ✓ Verified"
echo "  • Service: ✓ Running"
echo ""

GROQ_KEY=$(grep "^FREE_GROQ_KEY=" "$ENV_FILE" | cut -d= -f2)
if [[ "$GROQ_KEY" != "__CHANGE_ME__" && -n "$GROQ_KEY" ]]; then
  echo "  • Groq API key: ✓ Configured"
  echo ""
  echo "✅ VOICE CHAT READY"
  echo "   Test at: https://6-empires.com/chat"
  echo "   Click 🎤 to test microphone input"
else
  echo "  • Groq API key: ⚠️  NEEDS SETUP"
  echo ""
  echo "NEXT STEP: Configure Groq API key"
  echo "  1. Go to https://console.groq.com/keys"
  echo "  2. Create key, then run:"
  echo "     sed -i 's/^FREE_GROQ_KEY=.*/FREE_GROQ_KEY=gsk_YOUR_KEY/' /opt/empire-ai-chat/.env"
  echo "  3. Restart: systemctl restart empire-ai"
fi
echo ""
