---
title: EMPIRE AI Chat
tags: [empire, chat, app]
---

# EMPIRE AI Chat (localhost:8097)

Part of [[EMPIRE OS]]. Your private gold-themed chat page (`empire-ai-chat/`, Node zero-dep server).

## What changed
The model dropdown now lists all 8 [[Models|EMPIRE models]] (empire-prime, ceo, trading, coder, strategist, research, media, fast) plus any local Ollama models.

- **empire-*** models → routed to the VPS router `http://64.227.6.197:8000/v1` (key configured through `EMPIRE_KEY`; value `<redacted>`)
- local models → stay on local Ollama
- Mode dropdown (EMPIRE CORE / GOD MODE / Academic / Trading / Builder) injects [[GOD MODE Prompts]] server-side

## Files
`empire-ai-chat/server.js` (backend, edited), `index.html` (UI), `prompts.js` (GOD MODE library).

## To apply
Restart the local server: `PORT=8097 node ~/6-empires-os/empire-ai-chat/server.js` (or however it's launched). Verified: router answers empire-prime correctly.

Related: [[Models]] · [[Free LLM APIs]] · [[Infrastructure]]
