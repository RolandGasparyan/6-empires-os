#!/usr/bin/env bash
# ╔════════════════════════════════════════════════════════════╗
# ║  UPDATE GROQ API KEY — VPS CONFIGURATION                  ║
# ║  Run this to update the Groq API key in systemd config    ║
# ╚════════════════════════════════════════════════════════════╝

set -euo pipefail

GROQ_API_KEY="${1:-}"
SYSTEMD_GROQ_CONFIG="/etc/systemd/system/empire-ai.service.d/groq.conf"

if [[ -z "$GROQ_API_KEY" ]]; then
  echo "❌ Usage: bash deploy/scripts/update-groq-key.sh <groq_api_key>"
  echo ""
  echo "Example:"
  echo "  bash deploy/scripts/update-groq-key.sh gsk_YOUR_API_KEY_HERE"
  echo ""
  echo "To get a Groq API key:"
  echo "  1. Visit: https://console.groq.com/keys"
  echo "  2. Click 'Create API Key'"
  echo "  3. Copy the key (format: gsk_...)"
  exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  GROQ API KEY UPDATE                                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verify systemd config directory exists
if [[ ! -d "$(dirname "$SYSTEMD_GROQ_CONFIG")" ]]; then
  echo "▶ Creating systemd drop-in directory..."
  sudo mkdir -p "$(dirname "$SYSTEMD_GROQ_CONFIG")"
fi

# Update the Groq key in systemd config
echo "▶ Updating Groq API key in systemd configuration..."
sudo tee "$SYSTEMD_GROQ_CONFIG" > /dev/null <<EOF
[Service]
Environment="FREE_GROQ_KEY=$GROQ_API_KEY"
EOF
echo "✓ Groq API key updated"
echo ""

# Reload systemd and restart service
echo "▶ Reloading systemd configuration..."
sudo systemctl daemon-reload
echo "✓ Systemd reloaded"
echo ""

echo "▶ Restarting empire-ai service..."
sudo systemctl restart empire-ai
sleep 3

# Verify service is running
if sudo systemctl is-active empire-ai >/dev/null 2>&1; then
  echo "✓ Service restarted successfully"
else
  echo "❌ Service failed to start"
  echo ""
  echo "Recent logs:"
  sudo journalctl -u empire-ai -n 10 --no-pager
  exit 1
fi
echo ""

# Run verification tests
echo "▶ Running verification tests..."
echo ""

# Get the token
TOKEN=$(grep "^CHAT_ACCESS_TOKEN=" /opt/empire-ai-chat/.env 2>/dev/null | cut -d= -f2 || echo "")

if [[ -z "$TOKEN" ]]; then
  echo "⚠ Warning: Could not find CHAT_ACCESS_TOKEN"
  TOKEN="test-token"
fi

# Health check
echo "Testing health endpoint..."
HEALTH=$(curl -s http://127.0.0.1:8090/api/health 2>/dev/null | jq '.ok' 2>/dev/null || echo "false")
if [[ "$HEALTH" == "true" ]]; then
  echo "✓ Health check: PASSED"
else
  echo "⚠ Health check: FAILED ($HEALTH)"
fi
echo ""

# STT check with empty audio (should return error about empty file, but 200 OK)
echo "Testing STT endpoint..."
STT_RESP=$(curl -s -w "\n%{http_code}" -X POST http://127.0.0.1:8090/api/stt \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: audio/wav" \
  --data-binary @/dev/null 2>&1)

STT_CODE=$(echo "$STT_RESP" | tail -n1)
STT_BODY=$(echo "$STT_RESP" | head -n-1)

if [[ "$STT_CODE" == "200" ]]; then
  echo "✓ STT endpoint: HTTP $STT_CODE (responding)"
  echo "  Response: $STT_BODY"
else
  echo "⚠ STT endpoint: HTTP $STT_CODE"
  echo "  Response: $STT_BODY"
fi
echo ""

# TTS check
echo "Testing TTS endpoint..."
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
echo "║  ✅ GROQ API KEY UPDATED                                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✓ Groq API key: CONFIGURED"
echo "✓ Service: RUNNING"
echo "✓ Endpoints: TESTED"
echo ""
echo "Next steps:"
echo "  1. Test voice chat at: https://6-empires.com/chat"
echo "  2. Click the 🎤 microphone button"
echo "  3. Say something in Armenian or English"
echo "  4. Should transcribe and respond with voice"
echo ""
echo "If STT still doesn't work:"
echo "  • Check the key format (should start with 'gsk_')"
echo "  • Verify the key hasn't expired"
echo "  • Run: bash deploy/scripts/voice-chat-diagnostic.sh"
echo ""
