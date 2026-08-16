"""Fix user deletion cascades for vehicles and parking locations

Revision ID: 005_fix_user_deletion_cascades
Revises: 004_cascade_user_deletion
Create Date: 2026-08-16 07:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '005_fix_user_deletion_cascades'
down_revision = '004_cascade_user_deletion'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Properly add ON DELETE CASCADE to user_vehicles -> users.id
    with op.batch_alter_table('user_vehicles', schema=None) as batch_op:
        batch_op.create_foreign_key(
            'fk_user_vehicles_user_id_cascade',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE'
        )

    # 2. Remove ON DELETE CASCADE from parking_locations -> users.id for safety
    with op.batch_alter_table('parking_locations', schema=None) as batch_op:
        batch_op.drop_constraint('fk_parking_locations_owner_id_cascade', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_parking_locations_owner_id',
            'users',
            ['owner_id'],
            ['id']
        )

def downgrade() -> None:
    with op.batch_alter_table('parking_locations', schema=None) as batch_op:
        batch_op.drop_constraint('fk_parking_locations_owner_id', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_parking_locations_owner_id_cascade',
            'users',
            ['owner_id'],
            ['id'],
            ondelete='CASCADE'
        )

    with op.batch_alter_table('user_vehicles', schema=None) as batch_op:
        batch_op.drop_constraint('fk_user_vehicles_user_id_cascade', type_='foreignkey')
