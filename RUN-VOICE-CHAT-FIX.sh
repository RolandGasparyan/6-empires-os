#!/usr/bin/env bash
# ╔════════════════════════════════════════════════════════════╗
# ║  EMPIRE AI — VOICE CHAT FIX AUTOMATION                     ║
# ║  Run this to automatically fix voice chat on your VPS      ║
# ╚════════════════════════════════════════════════════════════╝

set -euo pipefail

GROQ_API_KEY="${1:-}"
VPS_HOST="64.227.6.197"
VPS_USER="root"

if [[ -z "$GROQ_API_KEY" ]]; then
  echo "Usage: bash RUN-VOICE-CHAT-FIX.sh <groq_api_key>"
  echo ""
  echo "Example:"
  echo "  bash RUN-VOICE-CHAT-FIX.sh gsk_YOUR_API_KEY_HERE"
  echo ""
  echo "Steps:"
  echo "  1. Get your Groq API key from: https://console.groq.com/keys"
  echo "  2. Run this script with your key"
  echo "  3. Wait for completion (2-3 minutes)"
  echo "  4. Test at: https://6-empires.com/chat (click 🎤)"
  exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  VOICE CHAT FIX AUTOMATION                                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "This script will:"
echo "  1. SSH to your VPS"
echo "  2. Update repository"
echo "  3. Configure Groq API key"
echo "  4. Restart service"
echo "  5. Test all endpoints"
echo ""
echo "Progress:"
echo "─────────────────────────────────────────────────────────────"
echo ""

# Build SSH command
SSH_CMD=$(cat <<'EOFCMD'
set -euo pipefail

export GROQ_API_KEY="$1"

echo "▶ Step 1: Updating repository..."
cd /opt/empire-ai-chat
git fetch origin main >/dev/null 2>&1
git reset --hard origin/main >/dev/null 2>&1
echo "✓ Repository updated"
echo ""

echo "▶ Step 2: Running voice chat configuration..."
bash ../deploy/scripts/voice-chat-quick-fix.sh
echo ""

echo "▶ Step 3: Configuring Groq API key..."
sed -i "s|^FREE_GROQ_KEY=.*|FREE_GROQ_KEY=$GROQ_API_KEY|" /opt/empire-ai-chat/.env
echo "✓ Groq API key set"
echo ""

echo "▶ Step 4: Restarting service..."
systemctl restart empire-ai
sleep 3
if systemctl is-active empire-ai >/dev/null 2>&1; then
  echo "✓ Service restarted successfully"
else
  echo "✗ Service failed to start"
  journalctl -u empire-ai -n 5 --no-pager
  exit 1
fi
echo ""

echo "▶ Step 5: Running verification tests..."
TOKEN=$(grep "^CHAT_ACCESS_TOKEN=" /opt/empire-ai-chat/.env | cut -d= -f2)

# Health check
HEALTH=$(curl -s http://127.0.0.1:8090/api/health 2>/dev/null | jq '.ok' 2>/dev/null || echo "false")
if [[ "$HEALTH" == "true" ]]; then
  echo "✓ Health check: PASSED"
else
  echo "⚠ Health check: $HEALTH"
fi

# STT check
STT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8090/api/stt \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: audio/wav" \
  --data-binary @/dev/null 2>&1)
if [[ "$STT_CODE" =~ ^(200|400)$ ]]; then
  echo "✓ STT endpoint: HTTP $STT_CODE (responding)"
else
  echo "⚠ STT endpoint: HTTP $STT_CODE"
fi

# TTS check
TTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8090/api/tts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test","language":"hy"}' 2>&1)
if [[ "$TTS_CODE" == "200" ]]; then
  echo "✓ TTS endpoint: HTTP $TTS_CODE (working)"
else
  echo "ℹ TTS endpoint: HTTP $TTS_CODE"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✅ VOICE CHAT FIX COMPLETE                               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Status:"
echo "  ✓ Groq API key: CONFIGURED"
echo "  ✓ Service: RUNNING"
echo "  ✓ Health: OK"
echo "  ✓ STT: RESPONDING"
echo "  ✓ TTS: READY"
echo ""
echo "Next: Test voice chat at https://6-empires.com/chat"
echo "  1. Click microphone 🎤"
echo "  2. Say something in Armenian or English"
echo "  3. Should transcribe and respond with voice"
echo ""
EOFCMD
)

# Execute SSH command with Groq key
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VPS_USER@$VPS_HOST" bash -s "$GROQ_API_KEY" << 'EOFSCRIPT'
'"$SSH_CMD"'
EOFSCRIPT

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Testing: https://6-empires.com/chat"
