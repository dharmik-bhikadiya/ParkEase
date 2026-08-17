"""Add is_verified to users and create email_verification_otps table

Revision ID: 007_add_email_verification_otp
Revises: 006_sync_user_deletion_cascades
Create Date: 2026-08-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '007_add_email_verification_otp'
down_revision = '006_sync_user_deletion_cascades'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Add is_verified column to users table defaulting to True for existing users
    op.add_column(
        'users',
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('true'))
    )

    # 2. Create email_verification_otps table
    op.create_table(
        'email_verification_otps',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('otp_hash', sa.String(length=255), nullable=False),
        sa.Column('attempts_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_resent_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        'ix_email_verification_otps_user_id',
        'email_verification_otps',
        ['user_id'],
        unique=True
    )

def downgrade() -> None:
    op.drop_index('ix_email_verification_otps_user_id', table_name='email_verification_otps')
    op.drop_table('email_verification_otps')
    op.drop_column('users', 'is_verified')
