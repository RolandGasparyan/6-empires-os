---
title: OpenHuman
tags: [empire, openhuman]
---

# OpenHuman (desktop app)

Part of [[EMPIRE OS]].

## Configured & saved
- LLM provider **EMPIRE GPU** → `http://64.227.6.197:8000/v1` (key `sk-empire-local`)
- Routing: Use Your Own Models → empire-router (saved)
- Voice: STT + TTS = **OpenHuman (Managed)** (saved)

## Known limitation
> [!warning] Beta bug — not infra
> OpenHuman v0.57.44 receives a valid **200 OK** from the router in ~1s but its UI hangs on "Thinking", and its own commands hit "not allowed by ACL". Confirmed across two separate servers — a client-side bug in the app, not your setup. Use the [[Models|EMPIRE PRIME web UI]] (:9090) as the reliable interface; revisit OpenHuman when they ship a fix.

Related: [[Infrastructure]] · [[Models]]
