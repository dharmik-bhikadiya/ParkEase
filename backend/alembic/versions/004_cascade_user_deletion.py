"""Cascade user deletion and foreign key cleanup migration

Revision ID: 004_cascade_user_deletion
Revises: 003_phase2b_parking_discovery
Create Date: 2026-08-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '004_cascade_user_deletion'
down_revision = '003_phase2b_parking_discovery'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. user_vehicles -> users.id (ON DELETE CASCADE)
    with op.batch_alter_table('user_vehicles', schema=None) as batch_op:
        batch_op.drop_constraint('fk_user_vehicles_user_id', type_='foreignkey') if False else None
        # We drop existing constraint if named, or batch_alter_table handles recreate
    
    # 2. refresh_tokens -> users.id (ON DELETE CASCADE)
    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_refresh_tokens_user_id_cascade',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE'
        )

    # 3. notifications -> users.id (ON DELETE CASCADE)
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_notifications_user_id_cascade',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE'
        )

    # 4. wallets -> users.id (ON DELETE CASCADE)
    with op.batch_alter_table('wallets', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_wallets_user_id_cascade',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE'
        )

    # 5. wallet_transactions -> wallets.id (ON DELETE CASCADE)
    with op.batch_alter_table('wallet_transactions', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_wallet_transactions_wallet_id_cascade',
            'wallets',
            ['wallet_id'],
            ['id'],
            ondelete='CASCADE'
        )

    # 6. bookings -> users.id (ON DELETE CASCADE)
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_bookings_user_id_cascade',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE'
        )

    # 7. payments -> bookings.id (ON DELETE CASCADE)
    with op.batch_alter_table('payments', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_payments_booking_id_cascade',
            'bookings',
            ['booking_id'],
            ['id'],
            ondelete='CASCADE'
        )

    # 8. qr_passes -> bookings.id (ON DELETE CASCADE)
    with op.batch_alter_table('qr_passes', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_qr_passes_booking_id_cascade',
            'bookings',
            ['booking_id'],
            ['id'],
            ondelete='CASCADE'
        )

    # 9. parking_staff_assignments -> users.id (ON DELETE CASCADE)
    with op.batch_alter_table('parking_staff_assignments', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_parking_staff_assignments_staff_user_id_cascade',
            'users',
            ['staff_user_id'],
            ['id'],
            ondelete='CASCADE'
        )

    # 10. parking_locations -> users.id (ON DELETE CASCADE)
    with op.batch_alter_table('parking_locations', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_parking_locations_owner_id_cascade',
            'users',
            ['owner_id'],
            ['id'],
            ondelete='CASCADE'
        )

def downgrade() -> None:
    pass
