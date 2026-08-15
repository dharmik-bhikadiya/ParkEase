# Database Schema & Migration Architecture

## Overview
ParkEase utilizes SQLAlchemy 2.0 ORM with PostgreSQL for production environments and SQLite for local development. Database migrations are managed via Alembic.

---

## Core Data Models

1. **`User` (`users`)**:
   - `id`, `email`, `hashed_password`, `full_name`, `phone_number`, `role` (`DRIVER`, `PARKING_OWNER`, `PARKING_STAFF`, `ADMIN`), `is_active`, `google_id`, `created_at`.
2. **`ParkingLocation` (`parking_locations`)**:
   - `id`, `name`, `address`, `city`, `area`, `latitude`, `longitude`, `owner_id`, `hourly_rate`, `status` (`PENDING_APPROVAL`, `ACTIVE`, `REJECTED`), `total_slots`.
3. **`ParkingSlot` (`parking_slots`)**:
   - `id`, `location_id`, `slot_number`, `floor`, `status` (`AVAILABLE`, `RESERVED`, `OCCUPIED`, `MAINTENANCE`).
4. **`Booking` (`bookings`)**:
   - `id`, `user_id`, `location_id`, `slot_id`, `vehicle_number`, `start_time`, `end_time`, `actual_entry_time`, `actual_exit_time`, `total_amount`, `overstay_charges`, `status` (`PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`, `EXPIRED`).
5. **`Wallet` & `WalletTransaction` (`wallets`, `wallet_transactions`)**:
   - `id`, `user_id`, `balance`, `currency`.
   - `id`, `wallet_id`, `amount`, `transaction_type` (`TOPUP`, `PAYMENT`, `REFUND`), `reference_id`, `description`, `created_at`.
6. **`QrPass` (`qr_passes`)**:
   - `id`, `booking_id`, `type` (`ENTRY`, `EXIT`), `qr_payload`, `hash_signature`, `valid_from`, `valid_until`, `is_used`, `used_at`.

---

## Running Database Migrations
To apply database migrations:
```bash
cd backend
alembic upgrade head
```

To create a new migration after modifying models:
```bash
cd backend
alembic revision --autogenerate -m "describe_migration_changes"
```
