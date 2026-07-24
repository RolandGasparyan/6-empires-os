---
title: Production Deployment
tags: [empire, infra, deploy, web]
updated: 2026-07-24
---

# Production Deployment — 6-empires.com

Part of [[EMPIRE OS]] · [[Infrastructure]]. Live public stack on `empire-cpu` (64.227.6.197), served by the Dockerized `config/docker-compose.prod.yml` nginx.

> [!success] Status: LIVE — all domains 200
> main · founder login · chat · api · booking all return `200`.

## Live URLs
- **https://6-empires.com** — cinematic "Sovereign OS v6" landing page (the `apps/web` Next.js app, `public/home-v6/` bundle served at `/`).
- **https://6-empires.com/founder/login** — real founder auth (server-side).
- **https://6-empires.com/chat** — Next COMMAND CHAT route (admin modal on the homepage redirects here on success).
- **https://api.6-empires.com/ready** — API health.
- **https://booking.6-empires.com** — REINCARNATION booking app (see [[EMPIRE AI Chat]] is separate; booking is the Flask app).

## Homepage Admin Login
- The close scene's hex **"6"** emblem opens the design's **ADMIN ACCESS** modal (`admin` / `19866666`, client-side gate — cosmetic, not the real auth).
- On success it redirects to **`/chat`**. Real security is the untouched `/founder/login`.

## Deploy (release script, run on the VPS)
```bash
DEPLOY_SHA=<main commit sha>
cd ~/6-empires-os
git fetch origin main
git reset --hard "$DEPLOY_SHA"
bash deploy/scripts/deploy-release.sh "$DEPLOY_SHA"
```
`deploy-release.sh` now **self-heals TLS certs**: before the stack comes up it checks the `config_certbotconf` volume and issues any missing cert via `certbot --standalone` (no more nginx cert crash-loop, no manual certbot step).

## Booking reverse proxy
- Vhost stored in-repo at `deploy/nginx/optional/40-booking.conf`; the deploy copies it into the loaded `conf.d/` **only when its cert exists**, so a missing booking cert can never crash the main-site nginx.
- Booking app (`reincarnation-booking` systemd unit) binds **`172.17.0.1:5000`** (docker gateway) — reachable from the nginx container, NOT exposed on the public interface. Fixed in the `BOOKING-AI-AGENT` repo (`deploy/reincarnation-booking.service`).

## Repos (source of truth on GitHub)
- `RolandGasparyan/6-empires-os` — web app, landing bundle, deploy scripts, this vault, [[EMPIRE AI Chat|empire-ai-chat]].
- `RolandGasparyan/BOOKING-AI-AGENT` — booking Flask app + its systemd unit / nginx.

Related: [[Infrastructure]] · [[EMPIRE AI Chat]] · [[Pending Actions]]
