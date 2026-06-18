# Deploy 6-EMPIRE OS → 6-empires.com (Hostinger VPS)

Three things only you can do (security boundary): set DNS, run SSH commands,
own the SSL prompt. Everything else is automated by `deploy/scripts/deploy-vps.sh`.

---

## STEP 1 — DNS (at your domain registrar)

Create these **A records**, all pointing at your VPS public IP `<VPS_IP>`:

| Type | Host / Name      | Value (points to) | TTL  |
|------|------------------|-------------------|------|
| A    | `@` (root)       | `<VPS_IP>`        | 3600 |
| A    | `www`            | `<VPS_IP>`        | 3600 |
| A    | `api`            | `<VPS_IP>`        | 3600 |

(Optional, only if you want a chat subdomain later: `A  chat  <VPS_IP>`.)

Wait until they resolve. Check from any machine:
```
dig +short 6-empires.com
dig +short api.6-empires.com
```
Both must return `<VPS_IP>` before Step 3, or the SSL cert request fails.

---

## STEP 2 — Open the firewall (on the VPS, once)
```bash
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow OpenSSH && sudo ufw --force enable
```

---

## STEP 3 — Get the code on the VPS + run the deploy

```bash
# clone (or pull) the repo on the VPS
git clone https://github.com/RolandGasparyan/6-empires-os.git ~/6-empires-os 2>/dev/null || \
  (cd ~/6-empires-os && git pull)
cd ~/6-empires-os
git checkout claude/great-lovelace-aq1yww   # the branch with the latest build

# one-shot deploy: secrets, build, SSL bootstrap, full stack
chmod +x deploy/scripts/deploy-vps.sh
CERTBOT_EMAIL=roland.gasparyan@gmail.com ./deploy/scripts/deploy-vps.sh
```

The script will:
1. Print this server's IP and your DNS resolution (sanity check).
2. Generate `.env` with fresh `JWT_SECRET`, DB + Neo4j passwords (once; never overwritten).
3. Build the `api` + `web` images (web bakes in the HTTPS api host).
4. Issue a Let's Encrypt cert for `6-empires.com`, `www`, `api`.
5. Start the full 8-service stack behind Nginx (HTTPS live).
6. Verify `api/health` and `/hq` over HTTPS and print the URLs.

---

## STEP 4 — First login
Go to `https://6-empires.com/founder/login`, register with
`roland.gasparyan@gmail.com` → auto-elevated to **founder** (matches `FOUNDER_EMAIL`).

---

## After it's up
- **I verify** the live site in Chrome: screenshot `/hq`, `/console`, `/chat`,
  confirm the padlock (valid SSL), check the console is clean, confirm `LIVE · TWIN`.
- Schedule backups: `crontab -e` → `0 3 * * * cd ~/6-empires-os && bash deploy/scripts/backup.sh`
- Cert auto-renews via the `certbot` service (checks every 12h).

## If something fails
```bash
cd ~/6-empires-os
docker compose -f config/docker-compose.prod.yml ps
docker compose -f config/docker-compose.prod.yml logs --tail=40 nginx
docker compose -f config/docker-compose.prod.yml logs --tail=40 api
docker compose -f config/docker-compose.prod.yml logs --tail=40 web
```
Paste the output and I'll diagnose.
