"""Create the 6-EMPIRE API baseline schema.

Revision ID: 20260713_0001
Revises: None
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260713_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255)),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("is_active", sa.Boolean()),
        sa.Column("is_admin", sa.Boolean()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_is_active", "users", ["is_active"])

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(128), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"])

    op.create_table(
        "agents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("role", sa.String(100), nullable=False),
        sa.Column("status", sa.String(50)),
        sa.Column("config", sa.JSON()),
        sa.Column("is_active", sa.Boolean()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_agents_name", "agents", ["name"])
    op.create_index("ix_agents_status", "agents", ["status"])

    op.create_table(
        "knowledge_documents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("document_type", sa.String(50), nullable=False),
        sa.Column("metadata", sa.JSON()),
        sa.Column("indexed", sa.Boolean()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_knowledge_documents_document_type", "knowledge_documents", ["document_type"])
    op.create_index("ix_knowledge_documents_indexed", "knowledge_documents", ["indexed"])

    op.create_table(
        "tasks",
        sa.Column("id", sa.String(16), nullable=False),
        sa.Column("agent_key", sa.String(32), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("state", sa.String(16), nullable=False),
        sa.Column("result", sa.Text()),
        sa.Column("error", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("started_at", sa.DateTime()),
        sa.Column("completed_at", sa.DateTime()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tasks_agent_key", "tasks", ["agent_key"])
    op.create_index("ix_tasks_state", "tasks", ["state"])
    op.create_index("ix_tasks_created_at", "tasks", ["created_at"])
    op.create_index("idx_tasks_agent_state", "tasks", ["agent_key", "state", "created_at"])

    op.create_table(
        "agent_memory",
        sa.Column("id", sa.String(16), nullable=False),
        sa.Column("agent_key", sa.String(32), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("vector_id", sa.String(64)),
        sa.Column("importance", sa.Float()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agent_memory_agent_key", "agent_memory", ["agent_key"])
    op.create_index("ix_agent_memory_created_at", "agent_memory", ["created_at"])
    op.create_index("idx_memory_agent_created", "agent_memory", ["agent_key", "created_at"])

    op.create_table(
        "messages",
        sa.Column("id", sa.String(16), nullable=False),
        sa.Column("channel", sa.String(40), nullable=False),
        sa.Column("sender", sa.String(16), nullable=False),
        sa.Column("agent_key", sa.String(32)),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("mentions", sa.JSON()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_messages_channel", "messages", ["channel"])
    op.create_index("ix_messages_created_at", "messages", ["created_at"])
    op.create_index("idx_messages_channel_created", "messages", ["channel", "created_at"])


def downgrade() -> None:
    op.drop_table("messages")
    op.drop_table("agent_memory")
    op.drop_table("tasks")
    op.drop_table("knowledge_documents")
    op.drop_table("agents")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
