# 6-EMPIRE OS — VPS Deployment Runbook (Hostinger)

This is the **exact sequence you run on your VPS**. Claude built and verified all
code and config in-repo; the steps below require your server, domain, and
credentials, which Claude cannot access. Each step has a check so you confirm green.

---

## 0. Prerequisites (one-time)

On the Hostinger VPS (Ubuntu 22+):

```bash
# Docker + compose
curl -fsSL https://get.docker.com | sh
sudo apt-get install -y docker-compose-plugin git
# Clone
git clone <your-repo-url> 6-empires-os && cd 6-empires-os
```

---

## 1. DNS records (Hostinger → DNS Zone for 6-empires.com)

Point every hostname at your VPS IP (replace `203.0.113.10`):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `203.0.113.10` | 3600 |
| A | `www` | `203.0.113.10` | 3600 |
| A | `api` | `203.0.113.10` | 3600 |
| A | `chat` | `203.0.113.10` | 3600 |
| AAAA | `@` | `<your IPv6>` (if any) | 3600 |

**Check:** `dig +short 6-empires.com api.6-empires.com` returns your IP.

---

## 2. Environment

```bash
cp .env.example .env
openssl rand -hex 32         # paste into JWT_SECRET
nano .env                    # fill POSTGRES_PASSWORD, NEO4J_PASSWORD, JWT_SECRET
```

**Never commit `.env`.** It is gitignored.

---

## 3. Issue SSL certificates (first run)

Nginx needs certs before it can start on 443. Bootstrap with a temporary
HTTP-only Nginx, then run certbot for all four hostnames on one cert:

```bash
# Bring up just the stack that serves the ACME challenge
docker compose -f config/docker-compose.prod.yml up -d nginx

docker compose -f config/docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d 6-empires.com -d www.6-empires.com -d api.6-empires.com -d chat.6-empires.com \
  --email roland.gasparyan@gmail.com --agree-tos --no-eff-email
```

**Check:** `ls` shows `/etc/letsencrypt/live/6-empires.com/fullchain.pem`.
Renewal is automatic (the `certbot` service loops `renew` every 12h).

---

## 4. Launch the full stack

```bash
docker compose -f config/docker-compose.prod.yml up -d --build
docker compose -f config/docker-compose.prod.yml ps
```

**Check:** all services show `healthy` / `running`.

---

## 5. Create the Founder account

```bash
curl -X POST https://api.6-empires.com/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"roland.gasparyan@gmail.com","username":"founder","password":"<strong-pw>"}'
# -> {"message":"registered","is_founder":true}
```

The email matching `FOUNDER_EMAIL` is auto-granted `is_admin`. Log in at
`https://6-empires.com/founder/login`.

---

## 6. Validate everything

```bash
bash deploy/scripts/healthcheck.sh   # HTTP 200, SSL expiry, containers, resources
bash deploy/scripts/db-probe.sh      # Postgres/Redis/Qdrant/Neo4j connectivity
```

**Target:** all four domains return HTTP 200, `/health` returns `{"status":"ok"}`,
all datastores respond.

---

## 7. Verification checklist (mark each green)

- [ ] `https://6-empires.com` → 200, 3D command center renders
- [ ] `https://www.6-empires.com` → 200
- [ ] `https://api.6-empires.com/health` → `{"status":"ok"}`
- [ ] `https://api.6-empires.com/docs` → Swagger UI
- [ ] `https://chat.6-empires.com` → 200
- [ ] `http://6-empires.com` → 301 redirect to HTTPS
- [ ] `/founder/login` → founder can log in; non-founder gets 403
- [ ] WebSocket `wss://api.6-empires.com/api/v1/ws/updates` streams
- [ ] Postgres/Redis/Qdrant/Neo4j all healthy
- [ ] SSL valid (padlock, no warnings) on all four hostnames

---

## Rollback

```bash
docker compose -f config/docker-compose.prod.yml down       # stop (keeps volumes/data)
git checkout <previous-tag> && docker compose ... up -d --build
```

Data volumes (`pgdata`, `redisdata`, `qdrantdata`, `neo4jdata`) persist across
`down`/`up`. Only `down -v` destroys data.
