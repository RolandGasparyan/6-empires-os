# EMPIRE PRIME - API Configuration Guide

## ✅ For Claude/OpenAI-Compatible Providers

When adding EMPIRE PRIME as a cloud provider, use these settings:

### **Option 1: If Running Locally (Recommended for Testing)**

**NAME:** EMPIRE PRIME  
**Slug:** empire-prime  
**OPENAI URL:** `http://localhost:8090/api/chat`  
**API KEY:** `<redacted>`

### **Option 2: If Running on VPS**

**NAME:** EMPIRE PRIME  
**Slug:** empire-prime  
**OPENAI URL:** `http://137.184.54.161:8090/api/chat`  
**API KEY:** `sk-your-empire-prime-key`

---

## ⚠️ Current Issue

The error shows:
```
Could not reach EMPIRE PRIME: [providers][list_models] failed to parse JSON: 
expected value at line 1 column 1 (body: <!doctype html>...)
```

**This means:** The URL is pointing to the HTML interface (port 8090), not an API endpoint.

---

## ✅ Solution: Use API Endpoint

You need to either:

### **A) Create an API Wrapper for EMPIRE PRIME**

Add this to your VPS setup to expose an OpenAI-compatible API:

```bash
# Deploy API wrapper on port 8091
cat > /var/www/empire-api/chat.js << 'API'
const http = require('http');

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    if (req.url === '/v1/models' && req.method === 'GET') {
        res.end(JSON.stringify({
            object: 'list',
            data: [
                { id: 'empire-prime', object: 'model', created: Date.now(), owned_by: 'empire' }
            ]
        }));
    } else if (req.url === '/v1/chat/completions' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            res.end(JSON.stringify({
                id: 'chatcmpl-' + Date.now(),
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: 'empire-prime',
                choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: `[EMPIRE PRIME] Processed: ${data.messages[data.messages.length-1].content}`
                    },
                    finish_reason: 'stop'
                }],
                usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
            }));
        });
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(8091, () => console.log('EMPIRE PRIME API on :8091'));
API
```

### **B) Use OpenAI API Key Instead**

If you have access to OpenAI's API:

**NAME:** EMPIRE PRIME (OpenAI)  
**Slug:** empire-prime-openai  
**OPENAI URL:** `https://api.openai.com/v1`  
**API KEY:** `sk-your-real-openai-key`

### **C) Use Ollama/LocalAI**

If using local models:

**NAME:** EMPIRE PRIME (Local)  
**Slug:** empire-prime-local  
**OPENAI URL:** `http://localhost:11434/v1`  
**API KEY:** `ollama`

---

## 🔧 Correct Setup for Your VPS

### **Step 1: Update the URL**

Change from:
```
http://localhost:8090/?model=empire-prime
```

To the API endpoint:
```
http://localhost:8090/api/v1/chat/completions
```

### **Step 2: Create Simple API Endpoint**

Add this Nginx config to expose an API:

```nginx
server {
    listen 8091;
    server_name _;
    
    location /v1/models {
        return 200 '{
            "object":"list",
            "data":[{"id":"empire-prime","object":"model"}]
        }';
    }
    
    location /v1/chat/completions {
        proxy_pass http://localhost:8090;
    }
}
```

### **Step 3: Add to Your Application**

In the cloud provider settings:

**NAME:** EMPIRE PRIME  
**Slug:** empire-prime  
**OPENAI URL:** `http://137.184.54.161:8091`  
**API KEY:** `<redacted>`

---

## 📋 Quick Fix Options

### **Fastest:** Use OpenAI directly
- Get API key from openai.com
- Use `https://api.openai.com/v1` as URL
- This works immediately

### **Best:** Create API wrapper
- Wrap your EMPIRE PRIME interface with an OpenAI-compatible API
- Takes ~5 minutes to set up
- Full control and customization

### **Alternative:** Use Ollama
- Install Ollama locally
- Run models on your machine
- Expose via `http://localhost:11434/v1`
- Free and offline

---

## 🎯 Recommended for Your Setup

Given your 6-EMPIRE architecture:

1. **Keep** the HTML interface at `:8090` (for manual chatting)
2. **Add** an API wrapper at `:8091` (for programmatic access)
3. **Add cloud provider** pointing to `:8091`

This gives you both interactive UI AND API access!

---

## Test the API

Once configured, test with:

```bash
export EMPIRE_KEY='<redacted>'
curl http://localhost:8091/v1/models \
  -H "Authorization: Bearer ${EMPIRE_KEY}"
```

You should get back a JSON list of available models.

---

## Files Ready in Your Output Folder

- ✅ `deploy-empire-prime-8090.sh` - Chat UI
- ✅ `FINAL-CODE-REVIEW-REPORT.md` - Code audit
- ✅ This file - API configuration
