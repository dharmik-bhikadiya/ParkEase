"""Phase 2B Parking Discovery, Owner, Pricing, Slots & Staff Assignment migration

Revision ID: 003_phase2b_parking_discovery
Revises: 002_add_google_auth_fields
Create Date: 2026-08-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '003_phase2b_parking_discovery'
down_revision = '002_add_google_auth_fields'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Create parking_pricing table
    op.create_table(
        'parking_pricing',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('parking_location_id', sa.String(length=36), sa.ForeignKey('parking_locations.id'), unique=True, nullable=False),
        sa.Column('bike_hourly_price', sa.Float(), nullable=False, server_default='10.0'),
        sa.Column('car_hourly_price', sa.Float(), nullable=False, server_default='30.0'),
        sa.Column('suv_hourly_price', sa.Float(), nullable=False, server_default='40.0'),
        sa.Column('ev_hourly_price', sa.Float(), nullable=False, server_default='35.0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # 2. Create parking_staff_assignments table
    op.create_table(
        'parking_staff_assignments',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('staff_user_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('parking_location_id', sa.String(length=36), sa.ForeignKey('parking_locations.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_parking_staff_assignments_staff_user_id', 'parking_staff_assignments', ['staff_user_id'])
    op.create_index('ix_parking_staff_assignments_parking_location_id', 'parking_staff_assignments', ['parking_location_id'])

def downgrade() -> None:
    op.drop_table('parking_staff_assignments')
    op.drop_table('parking_pricing')
