---
title: Free LLM APIs
tags: [empire, apis]
---

# Free LLM APIs — 19 Providers Wired

Part of [[EMPIRE OS]]. Pulled from `awesome-free-llm-apis`. All OpenAI-compatible; auto-activate when a key is set.

## Fastest free picks
1. **Groq** ⚡ — console.groq.com/keys — `FREE_GROQ_KEY`
2. **Cerebras** ⚡ — cloud.cerebras.ai — `FREE_CEREBRAS_KEY`
3. **SambaNova** ⚡ — cloud.sambanova.ai — `FREE_SAMBANOVA_KEY`
4. **Google Gemini** — aistudio.google.com/app/apikey — `FREE_GOOGLE_GEMINI_KEY`
5. **OpenRouter** — openrouter.ai/keys — `FREE_OPENROUTER_KEY`

## How to activate (one line)
```
echo 'FREE_GROQ_KEY=gsk_...' >> /root/6-empires-os-full/.env
cd /root/6-empires-os-full && docker compose restart api
```
Then EMPIRE answers at full cloud speed. See [[Pending Actions]].

## MCP server
`empire-free-llm` exposes `list_free_providers`, `list_active_providers`, `free_chat`. Built per mcp-builder, py_compile verified.

Related: [[Models]] · [[Infrastructure]]
