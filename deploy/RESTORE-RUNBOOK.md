# 6-EMPIRE OS — Backup & Restore Runbook

## Durable-state inventory

`deploy/scripts/backup.sh` creates a timestamped, checksummed backup set for:

- PostgreSQL: logical `pg_dump` (`postgres-<STAMP>.sql.gz`).
- Redis: synchronous persistence checkpoint plus named-volume snapshot.
- Qdrant and Neo4j: named-volume snapshots resolved from the running Compose
  containers, never from a hard-coded Compose project prefix.
- Empire Sync: `brain.json`, `state.json`, and `agents-state.json` when present
  in `${SYNC_STATE_DIR:-/opt/empire-sync}`.
- `manifest-<STAMP>.sha256`: checksums, source Git commit, Compose file, and the
  sync-state files included in the set.

Backups default to `${BACKUP_DIR:-~/empire-backups}` and 14-day retention.
Schedule on the VPS:

```bash
0 3 * * * cd ~/6-empires-os && BACKUP_DIR=~/empire-backups bash deploy/scripts/backup.sh >> ~/empire-backups/backup.log 2>&1
```

## Pre-restore checks

1. Copy the selected backup set to a throwaway host first.
2. Verify it: `cd ~/empire-backups && sha256sum -c manifest-<STAMP>.sha256`.
3. Record the current Git SHA and `docker compose -f config/docker-compose.prod.yml ps`.
4. Stop application writes before restoring production data.

## Restore PostgreSQL

Restore into an empty throwaway database first. For a production replacement,
create/drop the target database deliberately rather than replaying a full dump
over unknown existing state.

```bash
gunzip -c ~/empire-backups/postgres-<STAMP>.sql.gz | \
  docker compose -f config/docker-compose.prod.yml exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" "$POSTGRES_DB"
```

## Restore Redis, Qdrant, or Neo4j

The helper resolves the actual named volume from the running container. It
requires an explicit destructive-operation confirmation and restarts the
service after extraction.

```bash
RESTORE_CONFIRM=restore-qdrant \
  bash deploy/scripts/restore-volume.sh qdrant ~/empire-backups/qdrant-<STAMP>.tar.gz

RESTORE_CONFIRM=restore-neo4j \
  bash deploy/scripts/restore-volume.sh neo4j ~/empire-backups/neo4j-<STAMP>.tar.gz

RESTORE_CONFIRM=restore-redis \
  bash deploy/scripts/restore-volume.sh redis ~/empire-backups/redis-<STAMP>.tar.gz
```

## Restore Empire Sync state

```bash
sudo tar xzf ~/empire-backups/empire-sync-<STAMP>.tar.gz -C /opt/empire-sync
sudo systemctl restart empire-ai
```

Validate the restored JSON before restarting if the state came from an older
application version.

## Quarterly drill

Restore the latest set into a throwaway stack and verify database row counts,
Redis keys, Qdrant collections, Neo4j nodes, JSON parsing, `/health`, and agent
state hydration. Record restore duration and the manifest SHA in the operations
log. A backup that has never been restored is not a verified backup.
