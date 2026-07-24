---
title: Pending Actions
tags: [empire, todo]
---

# Pending Actions (your login required)

Part of [[EMPIRE OS]]. These three need your accounts — they can't be done for you.

> [!todo] 1 · Add a free LLM key
> Get a free Groq key at console.groq.com/keys, then add to the VPS `.env` and restart the api container. Unlocks instant speed. See [[Free LLM APIs]].

> [!done] 2 · Point the domain + HTTPS — DONE (2026-07-24)
> DNS is live and HTTPS is serving for 6-empires.com, www, api, chat, booking. Certs now auto-issue on every deploy (self-heal in `deploy-release.sh`) — no manual certbot. See [[Production Deployment]].

> [!todo] 3 · Revoke the DigitalOcean API token
> cloud.digitalocean.com/account/api/tokens — the migration token is no longer needed.

---
Also: [[OpenHuman]] beta chat bug is on the app vendor (not actionable by us).
