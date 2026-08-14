# Testing Guide

## Backend Pytest Suite
The backend contains a unit test suite covering Authentication, Parking Discovery, Booking Locking, Virtual Wallet Payments, and HMAC QR Session validation.

Run all tests:
```bash
cd backend
pytest
```

Current Test Modules (`backend/tests/`):
- `test_auth.py`: User registration, login, token refresh, password hashing.
- `test_parking.py`: Location creation, slot availability, admin approval workflow.
- `test_booking.py`: Booking creation, slot locking concurrency.
- `test_wallet.py`: Wallet balance top-up, atomic payments, cancellation refunds.
- `test_qr_session.py`: HMAC QR pass generation, gate entry approval, gate exit completion, anti-replay security.

---

## Web & Shared Build Validation
```bash
# Shared package build
npm run build:shared

# Web production bundle build
npm run build:web
```

---

## Mobile TypeScript Validation
```bash
cd apps/mobile
npx tsc --noEmit
```
