"""Sync user deletion cascades by dropping legacy non-cascading foreign keys

Revision ID: 006_sync_user_deletion_cascades
Revises: 005_fix_user_deletion_cascades
Create Date: 2026-08-16 07:10:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '006_sync_user_deletion_cascades'
down_revision = '005_fix_user_deletion_cascades'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. refresh_tokens: drop legacy non-cascading constraint
    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.drop_constraint('refresh_tokens_user_id_fkey', type_='foreignkey')

    # 2. user_vehicles: drop legacy non-cascading constraint
    with op.batch_alter_table('user_vehicles', schema=None) as batch_op:
        batch_op.drop_constraint('user_vehicles_user_id_fkey', type_='foreignkey')

    # 3. notifications: drop legacy non-cascading constraint
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.drop_constraint('notifications_user_id_fkey', type_='foreignkey')

    # 4. wallets: drop legacy non-cascading constraint
    with op.batch_alter_table('wallets', schema=None) as batch_op:
        batch_op.drop_constraint('wallets_user_id_fkey', type_='foreignkey')

    # 5. wallet_transactions: drop legacy non-cascading constraint
    with op.batch_alter_table('wallet_transactions', schema=None) as batch_op:
        batch_op.drop_constraint('wallet_transactions_wallet_id_fkey', type_='foreignkey')

    # 6. bookings: drop legacy non-cascading constraint
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.drop_constraint('bookings_user_id_fkey', type_='foreignkey')

    # 7. payments: drop legacy non-cascading constraint
    with op.batch_alter_table('payments', schema=None) as batch_op:
        batch_op.drop_constraint('payments_booking_id_fkey', type_='foreignkey')

    # 8. qr_passes: drop legacy non-cascading constraint
    with op.batch_alter_table('qr_passes', schema=None) as batch_op:
        batch_op.drop_constraint('qr_passes_booking_id_fkey', type_='foreignkey')

    # 9. parking_staff_assignments: drop legacy non-cascading constraint
    with op.batch_alter_table('parking_staff_assignments', schema=None) as batch_op:
        batch_op.drop_constraint('parking_staff_assignments_staff_user_id_fkey', type_='foreignkey')

    # 10. parking_locations: drop duplicate constraint, keeping parking_locations_owner_id_fkey (NO ACTION)
    with op.batch_alter_table('parking_locations', schema=None) as batch_op:
        batch_op.drop_constraint('fk_parking_locations_owner_id', type_='foreignkey')


def downgrade() -> None:
    with op.batch_alter_table('parking_locations', schema=None) as batch_op:
        batch_op.create_foreign_key('fk_parking_locations_owner_id', 'users', ['owner_id'], ['id'])

    with op.batch_alter_table('parking_staff_assignments', schema=None) as batch_op:
        batch_op.create_foreign_key('parking_staff_assignments_staff_user_id_fkey', 'users', ['staff_user_id'], ['id'])

    with op.batch_alter_table('qr_passes', schema=None) as batch_op:
        batch_op.create_foreign_key('qr_passes_booking_id_fkey', 'bookings', ['booking_id'], ['id'])

    with op.batch_alter_table('payments', schema=None) as batch_op:
        batch_op.create_foreign_key('payments_booking_id_fkey', 'bookings', ['booking_id'], ['id'])

    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.create_foreign_key('bookings_user_id_fkey', 'users', ['user_id'], ['id'])

    with op.batch_alter_table('wallet_transactions', schema=None) as batch_op:
        batch_op.create_foreign_key('wallet_transactions_wallet_id_fkey', 'wallets', ['wallet_id'], ['id'])

    with op.batch_alter_table('wallets', schema=None) as batch_op:
        batch_op.create_foreign_key('wallets_user_id_fkey', 'users', ['user_id'], ['id'])

    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.create_foreign_key('notifications_user_id_fkey', 'users', ['user_id'], ['id'])

    with op.batch_alter_table('user_vehicles', schema=None) as batch_op:
        batch_op.create_foreign_key('user_vehicles_user_id_fkey', 'users', ['user_id'], ['id'])

    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.create_foreign_key('refresh_tokens_user_id_fkey', 'users', ['user_id'], ['id'])
