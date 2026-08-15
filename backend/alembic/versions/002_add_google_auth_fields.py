"""add google auth fields

Revision ID: 002_add_google_auth_fields
Revises: 001_phase2a_auth_vehicles
Create Date: 2026-08-13 13:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '002_add_google_auth_fields'
down_revision = '001_phase2a_auth_vehicles'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('users', sa.Column('google_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('auth_provider', sa.String(length=50), server_default='email', nullable=False))
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('hashed_password', existing_type=sa.String(length=255), nullable=True)

def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.alter_column('hashed_password', existing_type=sa.String(length=255), nullable=False)
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'auth_provider')
    op.drop_column('users', 'google_id')
