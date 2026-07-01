# EMPIRE Assistant

Your own AI assistant for 6-EMPIRE — like OpenHuman, but EMPIRE-branded and powered by **your** brain. Three interfaces, one shared brain.

## The Brain (cloud + fallback)
- **Primary:** EMPIRE cloud — `https://6-empires.com/v1` → Groq **Llama-3.3-70B** + your Obsidian second-brain (~1.3s).
- **Fallback:** local Ollama `qwen3:14b` (offline/private) if the cloud is unreachable.
- Reuses the existing `empire-ai-chat/server.js` brain (groqStream → empireChat fallback + Obsidian context). No duplication.

## 1 · Web voice assistant  🌐
Live at **https://6-empires.com/chat**
- 🎤 mic button — speak (browser Whisper-grade SpeechRecognition)
- 🔊 speaker toggle — EMPIRE reads replies aloud (SpeechSynthesis)
- Voice-in → voice-out automatically. Works in Chrome / Edge / Safari. No extra server.

## 2 · CLI assistant  💻
Installed at `~/.local/bin/empire` (on PATH via `.zshrc`).
```bash
empire                      # interactive REPL (gold EMPIRE banner)
empire "what's my plan?"    # one-shot
echo "draft a tweet" | empire   # piped
```
Streams from the cloud brain, auto-falls back to local Ollama. Env overrides: `EMPIRE_API`, `EMPIRE_KEY`, `EMPIRE_MODEL`, `OLLAMA_URL`, `OLLAMA_MODEL`.

## 3 · Desktop app  🖥️
**/Applications/EMPIRE Assistant.app** — native gold-themed window wrapping the web voice assistant.
- Microphone auto-granted (voice works out of the box)
- Global hotkey **⌘⇧Space** to show/hide
- Gold EMPIRE dock icon

Rebuild/run from source: `cd desktop && npm start`

## Files
```
empire-assistant/
├── empire              # CLI assistant (Python, zero-dep)
├── README.md
└── desktop/
    ├── main.js         # Electron shell
    ├── preload.js
    ├── package.json
    └── empire-logo.png
```
