#!/bin/bash
# EMPIRE GitHub Sync Activation Script

echo "🚀 EMPIRE GitHub Integration Activation"
echo "========================================"
echo ""

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DAEMON_SCRIPT="$PROJECT_DIR/scripts/github-sync-daemon.py"
CONFIG_DIR="$HOME/.empire"
CONFIG_FILE="$CONFIG_DIR/github-sync.json"
LOG_FILE="$PROJECT_DIR/github-sync.log"

# Check if daemon script exists
if [ ! -f "$DAEMON_SCRIPT" ]; then
    echo "❌ Daemon script not found: $DAEMON_SCRIPT"
    exit 1
fi

# Create config directory
mkdir -p "$CONFIG_DIR"

# Check if config exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    echo "   Please run setup first"
    exit 1
fi

# Check for GitHub token
if grep -q "PLACEHOLDER_SET_GITHUB_TOKEN" "$CONFIG_FILE"; then
    echo "⚠️  GitHub token not configured"
    echo "   Steps to activate:"
    echo "   1. Get your token: https://github.com/settings/tokens/new"
    echo "   2. Edit: nano $CONFIG_FILE"
    echo "   3. Replace PLACEHOLDER_SET_GITHUB_TOKEN with your token"
    echo "   4. Run this script again"
    exit 1
fi

echo "✅ Configuration found"
echo "📍 Project: $PROJECT_DIR"
echo "🔧 Config: $CONFIG_FILE"
echo "📊 Log: $LOG_FILE"
echo ""

# Check if daemon is already running
if pgrep -f "github-sync-daemon.py" > /dev/null; then
    echo "⚠️  Daemon already running"
    echo "   To stop: pkill -f github-sync-daemon.py"
    echo "   To restart: $0 restart"
    exit 0
fi

# Start daemon
echo "🔄 Starting GitHub Sync Daemon..."
cd "$PROJECT_DIR"
nohup python3 "$DAEMON_SCRIPT" > "$LOG_FILE" 2>&1 &
DAEMON_PID=$!

sleep 2

if ps -p $DAEMON_PID > /dev/null; then
    echo "✅ Daemon started (PID: $DAEMON_PID)"
    echo ""
    echo "📡 Real-time Sync Active"
    echo "   • Sync interval: 5 minutes"
    echo "   • Direction: Bidirectional"
    echo "   • Repos: 6-empires-os"
    echo ""
    echo "📊 Monitor sync status:"
    echo "   tail -f $LOG_FILE"
    echo ""
    echo "⛔ To stop daemon:"
    echo "   pkill -f github-sync-daemon.py"
else
    echo "❌ Failed to start daemon"
    cat "$LOG_FILE"
    exit 1
fi
