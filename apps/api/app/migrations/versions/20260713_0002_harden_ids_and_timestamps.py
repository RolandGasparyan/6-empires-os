"""Widen generated IDs and make persisted timestamps timezone-aware.

Revision ID: 20260713_0002
Revises: 20260713_0001
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260713_0002"
down_revision: str | None = "20260713_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _make_utc(table: str, columns: Sequence[str]) -> None:
    with op.batch_alter_table(table) as batch:
        for column in columns:
            batch.alter_column(
                column,
                existing_type=sa.DateTime(),
                type_=sa.DateTime(timezone=True),
                postgresql_using=f"{column} AT TIME ZONE 'UTC'",
            )


def _make_naive(table: str, columns: Sequence[str]) -> None:
    with op.batch_alter_table(table) as batch:
        for column in columns:
            batch.alter_column(
                column,
                existing_type=sa.DateTime(timezone=True),
                type_=sa.DateTime(),
                postgresql_using=f"{column} AT TIME ZONE 'UTC'",
            )


def upgrade() -> None:
    for table in ("tasks", "agent_memory", "messages"):
        with op.batch_alter_table(table) as batch:
            batch.alter_column("id", existing_type=sa.String(16), type_=sa.String(36))

    _make_utc("users", ("created_at", "updated_at"))
    _make_utc("refresh_tokens", ("expires_at", "revoked_at", "created_at"))
    _make_utc("agents", ("created_at", "updated_at"))
    _make_utc("knowledge_documents", ("created_at",))
    _make_utc("tasks", ("created_at", "started_at", "completed_at"))
    _make_utc("agent_memory", ("created_at",))
    _make_utc("messages", ("created_at",))


def downgrade() -> None:
    _make_naive("messages", ("created_at",))
    _make_naive("agent_memory", ("created_at",))
    _make_naive("tasks", ("created_at", "started_at", "completed_at"))
    _make_naive("knowledge_documents", ("created_at",))
    _make_naive("agents", ("created_at", "updated_at"))
    _make_naive("refresh_tokens", ("expires_at", "revoked_at", "created_at"))
    _make_naive("users", ("created_at", "updated_at"))

    for table in ("tasks", "agent_memory", "messages"):
        with op.batch_alter_table(table) as batch:
            batch.alter_column("id", existing_type=sa.String(36), type_=sa.String(16))
