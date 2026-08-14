"""Phase 2A Auth Vehicles Refresh Tokens migration

Revision ID: 001_phase2a_auth_vehicles
Revises: 
Create Date: 2026-08-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_phase2a_auth_vehicles'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Update users table if needed or create base tables
    pass

def downgrade() -> None:
    pass
