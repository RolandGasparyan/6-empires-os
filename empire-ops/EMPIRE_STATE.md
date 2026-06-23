# 6-EMPIRE OS — System State (2026-06-19T22:10Z)

## Infrastructure
- Server: empire-cpu @ 64.227.6.197 (nyc1, 4 vCPU AMD / 16GB)
- Web UI: http://64.227.6.197:9090 (Open WebUI)
- Router/shim: :8000 /v1 (key sk-empire-local), streaming TTFB ~0.3s
- Stack: api, postgres, redis, qdrant, neo4j (docker compose), Ollama :11434
- nginx + certbot installed (HTTPS pending DNS)

## Models (8 branded, all: logo + tuned params + GOD MODE academic prompts)
empire-prime, empire-ceo, empire-trading, empire-coder, empire-strategist, empire-research, empire-media, empire-fast
Base models: llama3.2:1b (chat), llama3.2, mistral, nous-hermes2, nomic-embed-text

## Integrations
- 19 free LLM APIs catalogued + wired (auto-activate on key) — free_llm_providers.json
- MCP server: empire-free-llm (3 tools) — empire_free_mcp.py
- airllm installed
- Knowledge base EMPIRE_KNOWLEDGE_V2 (576 vectors, Chroma) — detached for CPU speed

## OpenHuman
- LLM provider EMPIRE GPU -> http://64.227.6.197:8000/v1, routing saved
- Voice STT/TTS = OpenHuman Managed (saved)
- Known beta bug: chat hangs after 200 OK (client-side ACL), not infra

## Pending (user action)
1. Add free key (Groq) to .env -> instant speed
2. Hostinger A-record 6-empires.com -> 64.227.6.197 -> then HTTPS
3. Revoke DO API token
