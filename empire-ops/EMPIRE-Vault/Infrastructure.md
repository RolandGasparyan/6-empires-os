---
title: Infrastructure
tags: [empire, infra]
---

# Infrastructure

Part of [[EMPIRE OS]].

## Server
- `empire-cpu` @ **64.227.6.197** — DigitalOcean nyc1, 4 vCPU AMD / 16GB RAM
- Old box `137.184.54.161` **destroyed** 2026-06-19 (stopped ~$48/mo double-billing)

## Services (Docker)
- Router/shim `:8000` `/v1` (key configured through `EMPIRE_KEY`; value `<redacted>`) — streaming TTFB ~0.3s
- Open WebUI `:9090` — the [[Models|EMPIRE PRIME]] web interface
- Postgres, Redis, Qdrant, Neo4j
- Ollama `:11434` — `OLLAMA_KEEP_ALIVE=-1`
- Dockerized nginx + certbot (`config/docker-compose.prod.yml`) → **HTTPS live** for 6-empires.com, www, api, chat, booking. Certs auto-issue on deploy (self-heal). See [[Production Deployment]].
- Booking Flask app (`reincarnation-booking`) on **172.17.0.1:5000** (docker gateway — behind nginx, not public).

## Base models
`llama3.2:1b` (chat default), `llama3.2`, `mistral`, `nous-hermes2`, `nomic-embed-text`

## Knowledge base
`EMPIRE_KNOWLEDGE_V2` — 576 vectors in ChromaDB. Detached from models for CPU speed; re-enable on GPU. See [[Models]].
