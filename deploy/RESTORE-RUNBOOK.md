# 6-EMPIRE OS — Backup & Restore Runbook

## Backups (automated)
`deploy/scripts/backup.sh` dumps Postgres and snapshots Qdrant/Neo4j volumes to
`$BACKUP_DIR` (default `~/empire-backups`), keeping 14 days.

**Cron (on the VPS):**
```
0 3 * * * cd ~/6-empires-os && BACKUP_DIR=~/empire-backups bash deploy/scripts/backup.sh >> ~/empire-backups/backup.log 2>&1
```

## Restore Postgres
```bash
gunzip -c ~/empire-backups/pg-<STAMP>.sql.gz | \
  docker compose -f config/docker-compose.prod.yml exec -T postgres \
  psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

## Restore a volume (Qdrant example)
```bash
docker compose -f config/docker-compose.prod.yml stop qdrant
docker run --rm -v config_qdrantdata:/data -v ~/empire-backups:/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/qdrant-<STAMP>.tar.gz -C /data"
docker compose -f config/docker-compose.prod.yml start qdrant
```

## Quarterly drill
Restore the latest backup into a throwaway stack and confirm `/health` + agent
state load. A backup you have never restored is not a backup.
