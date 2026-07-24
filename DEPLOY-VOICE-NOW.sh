#!/usr/bin/env bash
# ONE-LINE VOICE CHAT DEPLOYMENT
# Copy the exact command below and run it in your terminal with your Groq key

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OPTION A: Use GitHub Actions (Automatic, no SSH needed)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Go to this URL in your browser (3 clicks = done):
# https://github.com/RolandGasparyan/6-empires-os/actions/workflows/fix-voice-chat.yml
# 1. Click "Run workflow"
# 2. Click "Run workflow" button
# 3. Wait 2-3 minutes

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OPTION B: Use GitHub CLI (If gh is installed)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Run this command:
# gh workflow run fix-voice-chat.yml --repo RolandGasparyan/6-empires-os

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OPTION C: Direct SSH deployment (Fastest if SSH key is set up)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Replace YOUR_GROQ_KEY with your actual key from:
# https://console.groq.com/keys

# Then run:
# bash RUN-VOICE-CHAT-FIX.sh gsk_YOUR_GROQ_KEY

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  VOICE CHAT DEPLOYMENT - PICK YOUR METHOD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "EASIEST (GitHub UI - 3 clicks):"
echo "  → https://github.com/RolandGasparyan/6-empires-os/actions"
echo "  → Find 'Fix Voice Chat on VPS' workflow"
echo "  → Click 'Run workflow'"
echo ""
echo "COMMAND LINE (GitHub CLI):"
echo "  → gh workflow run fix-voice-chat.yml --repo RolandGasparyan/6-empires-os"
echo ""
echo "DIRECT SSH (Script-based):"
echo "  → Get Groq key: https://console.groq.com/keys"
echo "  → bash RUN-VOICE-CHAT-FIX.sh gsk_YOUR_KEY_HERE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After deployment (2-3 minutes), test at:"
echo "  https://6-empires.com/chat"
echo "  (Click 🎤 microphone, speak, hear Armenian response)"
echo ""
