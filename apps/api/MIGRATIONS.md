# Database migrations

Run migrations from `apps/api`:

```bash
alembic upgrade head
```

The baseline captures the schema formerly created by startup `create_all`; the
second migration widens generated IDs and converts UTC timestamps to
timezone-aware columns. For an existing database created by that old startup
path, compare it with the baseline before using `alembic stamp 20260713_0001`,
then run `alembic upgrade head`. Stamping does not change schema and must only
be done after the existing columns and indexes have been verified.

Production startup does not call `create_all`. Apply migrations before starting
the API. Development keeps `create_all` as a local convenience.
