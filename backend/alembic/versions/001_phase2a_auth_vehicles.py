"""Phase 2A Auth Vehicles Refresh Tokens migration

Revision ID: 001_phase2a_auth_vehicles
Revises: 
Create Date: 2026-08-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_phase2a_auth_vehicles'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=True),
        sa.Column('role', sa.String(length=50), server_default='USER', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_phone_number', 'users', ['phone_number'], unique=True)

    # 2. user_vehicles table
    op.create_table(
        'user_vehicles',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('vehicle_type', sa.String(length=50), server_default='CAR', nullable=False),
        sa.Column('registration_number', sa.String(length=30), nullable=False),
        sa.Column('nickname', sa.String(length=100), nullable=True),
        sa.Column('is_ev', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_default', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_user_vehicles_user_id', 'user_vehicles', ['user_id'])
    op.create_index('ix_user_vehicles_registration_number', 'user_vehicles', ['registration_number'])

    # 3. refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('token_hash', sa.String(length=255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_refresh_tokens_user_id', 'refresh_tokens', ['user_id'])
    op.create_index('ix_refresh_tokens_token_hash', 'refresh_tokens', ['token_hash'], unique=True)

    # 4. parking_locations table
    op.create_table(
        'parking_locations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('owner_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parking_type', sa.String(length=50), server_default='OTHER', nullable=False),
        sa.Column('address', sa.String(length=300), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('area', sa.String(length=100), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('images', sa.JSON(), nullable=True),
        sa.Column('opening_time', sa.String(length=20), server_default='00:00', nullable=False),
        sa.Column('closing_time', sa.String(length=20), server_default='23:59', nullable=False),
        sa.Column('covered_parking', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('security', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('cctv', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('ev_charging', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('wheelchair_access', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('washroom', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('total_slots', sa.Integer(), server_default='0', nullable=False),
        sa.Column('available_slots', sa.Integer(), server_default='0', nullable=False),
        sa.Column('hourly_rate', sa.Float(), server_default='20.0', nullable=False),
        sa.Column('rating', sa.Float(), server_default='4.5', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='PENDING_APPROVAL', nullable=False),
        sa.Column('is_open', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_parking_locations_owner_id', 'parking_locations', ['owner_id'])
    op.create_index('ix_parking_locations_parking_type', 'parking_locations', ['parking_type'])
    op.create_index('ix_parking_locations_city', 'parking_locations', ['city'])
    op.create_index('ix_parking_locations_area', 'parking_locations', ['area'])
    op.create_index('ix_parking_locations_latitude', 'parking_locations', ['latitude'])
    op.create_index('ix_parking_locations_longitude', 'parking_locations', ['longitude'])
    op.create_index('ix_parking_locations_status', 'parking_locations', ['status'])

    # 5. parking_slots table
    op.create_table(
        'parking_slots',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('location_id', sa.String(length=36), sa.ForeignKey('parking_locations.id'), nullable=False),
        sa.Column('slot_number', sa.String(length=50), nullable=False),
        sa.Column('floor', sa.String(length=20), server_default='Ground', nullable=False),
        sa.Column('section', sa.String(length=50), server_default='Section A', nullable=False),
        sa.Column('vehicle_type', sa.String(length=50), server_default='CAR', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='AVAILABLE', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_parking_slots_location_id', 'parking_slots', ['location_id'])
    op.create_index('ix_parking_slots_status', 'parking_slots', ['status'])

    # 6. bookings table
    op.create_table(
        'bookings',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('location_id', sa.String(length=36), sa.ForeignKey('parking_locations.id'), nullable=False),
        sa.Column('slot_id', sa.String(length=36), sa.ForeignKey('parking_slots.id'), nullable=False),
        sa.Column('vehicle_number', sa.String(length=30), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_hours', sa.Float(), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='PENDING', nullable=False),
        sa.Column('actual_entry_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actual_exit_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('overstay_charges', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 7. wallets table
    op.create_table(
        'wallets',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id'), unique=True, nullable=False),
        sa.Column('balance', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('currency', sa.String(length=10), server_default='INR', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 8. wallet_transactions table
    op.create_table(
        'wallet_transactions',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('wallet_id', sa.String(length=36), sa.ForeignKey('wallets.id'), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('reference_id', sa.String(length=100), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 9. payments table
    op.create_table(
        'payments',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('booking_id', sa.String(length=36), sa.ForeignKey('bookings.id'), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('method', sa.String(length=50), server_default='WALLET', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='PENDING', nullable=False),
        sa.Column('transaction_signature', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 10. qr_passes table
    op.create_table(
        'qr_passes',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('booking_id', sa.String(length=36), sa.ForeignKey('bookings.id'), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('qr_payload', sa.String(length=500), nullable=False),
        sa.Column('hash_signature', sa.String(length=255), nullable=False),
        sa.Column('valid_from', sa.DateTime(timezone=True), nullable=False),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_used', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 11. notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('message', sa.String(length=500), nullable=False),
        sa.Column('type', sa.String(length=50), server_default='INFO', nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('qr_passes')
    op.drop_table('payments')
    op.drop_table('wallet_transactions')
    op.drop_table('wallets')
    op.drop_table('bookings')
    op.drop_table('parking_slots')
    op.drop_table('parking_locations')
    op.drop_table('refresh_tokens')
    op.drop_table('user_vehicles')
    op.drop_table('users')
