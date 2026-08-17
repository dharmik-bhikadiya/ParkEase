"""Create pending_registrations table

Revision ID: 008_create_pending_registrations
Revises: 007_add_email_verification_otp
Create Date: 2026-08-17 10:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '008_create_pending_registrations'
down_revision = '007_add_email_verification_otp'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'pending_registrations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='USER'),
        sa.Column('otp_hash', sa.String(length=255), nullable=False),
        sa.Column('attempts_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_resent_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        'ix_pending_registrations_email',
        'pending_registrations',
        ['email'],
        unique=True
    )

def downgrade() -> None:
    op.drop_index('ix_pending_registrations_email', table_name='pending_registrations')
    op.drop_table('pending_registrations')
