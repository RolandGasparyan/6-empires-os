
---

## 🤖 EMPIRE AI — private chat app (NEW)

Gold/black EMPIRE AI chat UI (matches brand screenshot) → talks to **your own local AI models** via Ollama. Lives in repo at `empire-ai-chat/`.

- **Verified locally:** UI renders with gold logo, connected to Ollama, live streaming chat tested in browser with your real model `qwen3:14b` (also `gemma3:1b`, `bge-m3`).
- **Files:** `server.js` (zero-dep Node, streaming proxy), `index.html` (gold UI), `empire-mark.svg`, `INSTALL_ON_VPS.sh`.

### Install on NEW VPS — 64.227.6.197 (DO droplet 578886726)
SSH in as root, then one paste:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/RolandGasparyan/6-empires-os/claude/great-lovelace-aq1yww/empire-ai-chat/INSTALL_ON_VPS.sh)
```

Installs Ollama + pulls `gemma3:1b` (fits low RAM) + deploys chat as a systemd service + nginx on :80.
Then open **http://64.227.6.197/**. Bigger model: `EMPIRE_MODEL=qwen2.5:7b bash INSTALL_ON_VPS.sh`.

> ⚠️ Claude could not SSH into 64.227.6.197 — `Permission denied (publickey)`. Roland runs the installer himself (the box has no key Claude can auth with).

Latest commit: `5de5ed7`
