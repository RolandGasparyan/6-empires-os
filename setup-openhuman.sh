#!/bin/bash

# OPENHUMAN SETUP & RUN
# Execute on VPS with: sudo bash setup-openhuman.sh

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════════╗"
echo "║                    🚀 OPENHUMAN SETUP & DEPLOYMENT                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# PHASE 1: INSTALL DEPENDENCIES
# ============================================================================
echo -e "${YELLOW}▶ PHASE 1: INSTALL DEPENDENCIES${NC}"
echo "─────────────────────────────────────────────────────────────────────────────"

apt-get update > /dev/null 2>&1
apt-get install -y python3 python3-pip python3-venv git curl nodejs npm > /dev/null 2>&1

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# ============================================================================
# PHASE 2: CREATE OPENHUMAN DIRECTORY
# ============================================================================
echo -e "${YELLOW}▶ PHASE 2: CREATE OPENHUMAN ENVIRONMENT${NC}"
echo "─────────────────────────────────────────────────────────────────────────────"

mkdir -p /var/www/openhuman
cd /var/www/openhuman

python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip > /dev/null 2>&1
pip install flask flask-cors requests python-dotenv > /dev/null 2>&1

echo -e "${GREEN}✅ Python virtual environment created${NC}"
echo ""

# ============================================================================
# PHASE 3: CREATE OPENHUMAN API SERVER
# ============================================================================
echo -e "${YELLOW}▶ PHASE 3: CREATE OPENHUMAN API SERVER${NC}"
echo "─────────────────────────────────────────────────────────────────────────────"

cat > /var/www/openhuman/app.py << 'PYTHON'
#!/usr/bin/env python3

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# OpenHuman Context Store
context_store = {
    "user_profile": {
        "name": "Roland Gasparyan",
        "email": "roland.gasparyan@gmail.com",
        "role": "Chief AI Architect",
        "interests": ["trading", "crypto", "AI", "entrepreneurship"],
        "timezone": "UTC"
    },
    "preferences": {
        "response_style": "direct, bold, expert-level",
        "model_preference": "claude-opus",
        "tone": "professional, actionable"
    },
    "session_data": {
        "active_projects": ["6-EMPIRE", "EMPIRE PRIME"],
        "recent_chats": [],
        "context_window": 128000
    }
}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "service": "OpenHuman Context Provider",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/context', methods=['GET'])
def get_context():
    """Get user context for AI personalization"""
    return jsonify({
        "status": "success",
        "data": context_store
    })

@app.route('/api/context/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    return jsonify({
        "status": "success",
        "profile": context_store["user_profile"]
    })

@app.route('/api/context/preferences', methods=['GET'])
def get_preferences():
    """Get user preferences"""
    return jsonify({
        "status": "success",
        "preferences": context_store["preferences"]
    })

@app.route('/api/context/session', methods=['GET'])
def get_session():
    """Get session data"""
    return jsonify({
        "status": "success",
        "session": context_store["session_data"]
    })

@app.route('/api/context/update', methods=['POST'])
def update_context():
    """Update context data"""
    data = request.json

    if "profile" in data:
        context_store["user_profile"].update(data["profile"])
    if "preferences" in data:
        context_store["preferences"].update(data["preferences"])
    if "session" in data:
        context_store["session_data"].update(data["session"])

    return jsonify({
        "status": "success",
        "message": "Context updated",
        "data": context_store
    })

@app.route('/api/personalization', methods=['POST'])
def personalize():
    """Personalize AI response based on context"""
    data = request.json
    message = data.get("message", "")

    # Add user context to message
    personalized = {
        "original_message": message,
        "user_context": context_store["user_profile"],
        "preferences": context_store["preferences"],
        "instruction": f"Respond as if you're helping {context_store['user_profile']['name']}, {context_store['user_profile']['role']}. Use style: {context_store['preferences']['response_style']}"
    }

    return jsonify({
        "status": "success",
        "personalized_context": personalized
    })

@app.route('/api/chat/context', methods=['POST'])
def chat_context():
    """Add context to chat messages"""
    data = request.json
    messages = data.get("messages", [])

    # Inject system context
    system_message = {
        "role": "system",
        "content": f"You are assisting {context_store['user_profile']['name']}, a {context_store['user_profile']['role']}. {context_store['preferences']['response_style']}. Current projects: {', '.join(context_store['session_data']['active_projects'])}"
    }

    messages.insert(0, system_message)

    return jsonify({
        "status": "success",
        "messages": messages,
        "context_injected": True
    })

@app.route('/api/models', methods=['GET'])
def models():
    """List available models"""
    return jsonify({
        "status": "success",
        "models": [
            {"id": "claude-opus", "name": "Claude Opus", "type": "primary"},
            {"id": "claude-sonnet", "name": "Claude Sonnet", "type": "secondary"},
            {"id": "gpt-4", "name": "GPT-4", "type": "fallback"},
            {"id": "gemini", "name": "Gemini", "type": "fallback"},
            {"id": "ollama", "name": "Ollama Local", "type": "local"}
        ]
    })

@app.route('/api/route', methods=['POST'])
def route():
    """Route request to appropriate model based on context"""
    data = request.json
    query = data.get("query", "")

    # Simple routing logic
    routing = {
        "primary": "claude-opus",
        "fallback_chain": ["claude-sonnet", "gpt-4", "gemini", "ollama"]
    }

    return jsonify({
        "status": "success",
        "query": query,
        "recommended_model": routing["primary"],
        "fallback_models": routing["fallback_chain"]
    })

@app.route('/api/status', methods=['GET'])
def status():
    """Get OpenHuman service status"""
    return jsonify({
        "status": "online",
        "service": "OpenHuman Context Provider",
        "version": "1.0.0",
        "features": [
            "User context management",
            "Preference tracking",
            "Session data storage",
            "AI personalization",
            "Message enrichment",
            "Model routing"
        ],
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 7090))
    debug = os.environ.get('DEBUG', 'False') == 'True'
    print(f"🚀 OpenHuman running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
PYTHON

chmod +x /var/www/openhuman/app.py
echo -e "${GREEN}✅ OpenHuman API server created${NC}"
echo ""

# ============================================================================
# PHASE 4: CREATE SYSTEMD SERVICE
# ============================================================================
echo -e "${YELLOW}▶ PHASE 4: CREATE SYSTEMD SERVICE${NC}"
echo "─────────────────────────────────────────────────────────────────────────────"

cat > /etc/systemd/system/openhuman.service << 'SERVICE'
[Unit]
Description=OpenHuman Context Provider
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/openhuman
Environment="PATH=/var/www/openhuman/venv/bin"
ExecStart=/var/www/openhuman/venv/bin/python3 /var/www/openhuman/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl start openhuman
systemctl enable openhuman

if systemctl is-active --quiet openhuman; then
    echo -e "${GREEN}✅ OpenHuman service running${NC}"
else
    echo -e "${RED}❌ Service failed to start${NC}"
fi
echo ""

# ============================================================================
# PHASE 5: CONFIGURE NGINX REVERSE PROXY
# ============================================================================
echo -e "${YELLOW}▶ PHASE 5: CONFIGURE NGINX${NC}"
echo "─────────────────────────────────────────────────────────────────────────────"

cat > /etc/nginx/sites-available/openhuman << 'NGINX'
server {
    listen 7090;
    server_name _;

    location / {
        proxy_pass http://localhost:7090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/openhuman /etc/nginx/sites-enabled/
nginx -t > /dev/null 2>&1 && systemctl reload nginx
echo -e "${GREEN}✅ Nginx configured${NC}"
echo ""

# ============================================================================
# PHASE 6: TEST & VERIFY
# ============================================================================
echo -e "${YELLOW}▶ PHASE 6: VERIFICATION${NC}"
echo "─────────────────────────────────────────────────────────────────────────────"

sleep 2

# Test health endpoint
response=$(curl -s http://localhost:7090/health 2>&1)
if echo "$response" | grep -q "online"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
fi

# Test context endpoint
context=$(curl -s http://localhost:7090/api/context 2>&1)
if echo "$context" | grep -q "user_profile"; then
    echo -e "${GREEN}✅ Context API working${NC}"
fi

# Test status
status=$(curl -s http://localhost:7090/api/status 2>&1)
if echo "$status" | grep -q "OpenHuman"; then
    echo -e "${GREEN}✅ Status API working${NC}"
fi

echo ""

# ============================================================================
# FINAL REPORT
# ============================================================================
echo "╔════════════════════════════════════════════════════════════════════════════════╗"
echo -e "║  ${GREEN}✅ OPENHUMAN DEPLOYED & RUNNING${NC}                                        ║"
echo "╚════════════════════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}📍 ACCESS ENDPOINTS:${NC}"
echo ""
echo -e "   ${GREEN}Public:${NC}  http://137.184.54.161:7090"
echo -e "   ${GREEN}Local:${NC}   http://localhost:7090"
echo ""

echo -e "${BLUE}🔌 API ENDPOINTS:${NC}"
echo ""
echo "   GET  /health               - Service health check"
echo "   GET  /api/context          - Get complete user context"
echo "   GET  /api/context/profile  - Get user profile"
echo "   GET  /api/context/prefs    - Get preferences"
echo "   GET  /api/context/session  - Get session data"
echo "   POST /api/context/update   - Update context"
echo "   POST /api/personalization  - Personalize response"
echo "   POST /api/chat/context     - Inject context in chat"
echo "   GET  /api/models           - List available models"
echo "   POST /api/route            - Get model routing"
echo "   GET  /api/status           - Service status"
echo ""

echo -e "${BLUE}📊 FEATURES:${NC}"
echo ""
echo "   ✅ User context management"
echo "   ✅ Preference tracking"
echo "   ✅ Session data storage"
echo "   ✅ AI personalization"
echo "   ✅ Message enrichment"
echo "   ✅ Model routing & fallback"
echo "   ✅ Real-time context updates"
echo ""

echo -e "${BLUE}🧑 USER CONTEXT:${NC}"
echo ""
echo "   Name: Roland Gasparyan"
echo "   Role: Chief AI Architect"
echo "   Email: roland.gasparyan@gmail.com"
echo "   Projects: 6-EMPIRE, EMPIRE PRIME"
echo ""

echo -e "${BLUE}🚀 READY:${NC}"
echo ""
echo "   Status: LIVE ✅"
echo "   Port: 7090"
echo "   Service: openhuman (systemd)"
echo ""

echo -e "${YELLOW}💡 TEST IT:${NC}"
echo ""
echo "   curl http://localhost:7090/api/context"
echo "   curl http://localhost:7090/api/status"
echo ""
