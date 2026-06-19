# EMPIRE AI — private chat app

Gold/black **EMPIRE AI** chat interface (matches the 6 EMPIRES brand) that talks to **your own local AI models** via Ollama. Zero-dependency Node server, single HTML file, token streaming.

## Files
- `server.js` — zero-dep Node HTTP server. Serves the UI, proxies `/api/chat` (streaming) + `/api/health` + `/api/models` to Ollama, serves the brand mark.
- `index.html` — the gold EMPIRE AI UI (model picker, streaming bubbles, auto-grow composer).
- `empire-mark.svg` — the gold quatrefoil brand mark.
- `INSTALL_ON_VPS.sh` — one-paste installer (Ollama + app + systemd + nginx).

## Run locally
```bash
PORT=8097 OLLAMA_URL=http://127.0.0.1:11434 node server.js
# open http://localhost:8097
```

## Deploy to the VPS (64.227.6.197)
SSH into the box as root, then:
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/RolandGasparyan/6-empires-os/claude/great-lovelace-aq1yww/empire-ai-chat/INSTALL_ON_VPS.sh)
```
Override the model for a bigger box:
```bash
EMPIRE_MODEL=qwen2.5:7b bash INSTALL_ON_VPS.sh
```
Then open **http://64.227.6.197/**

## Env
| var | default | purpose |
|---|---|---|
| `PORT` | 8090 | server port |
| `OLLAMA_URL` | http://127.0.0.1:11434 | Ollama endpoint |
| `EMPIRE_MODEL` | llama3.2:1b | fallback model |

## Verified
- ✅ UI renders (gold logo, header, hero, composer) — matches brand screenshot
- ✅ Connects to local Ollama, lists models live (`qwen3:14b`, `gemma3:1b`, `bge-m3`)
- ✅ Live streaming chat tested end-to-end in browser
- ✅ Graceful errors when backend is down
