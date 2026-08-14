# System Architecture — ParkEase Monorepo

## Overview

ParkEase is built as a unified monorepo platform designed for high concurrency, real-time parking spot discovery, reservation concurrency control, virtual wallet transactions, and HMAC-SHA256 signed QR gate access.

```text
               +----------------------------------+
               |        Clients & Interfaces       |
               +----------------------------------+
               |  Web App (React + Vite + TS)     |
               |  Mobile App (React Native/Expo)   |
               +----------------+-----------------+
                                |
                                | REST API (JSON / JWT)
                                v
               +----------------------------------+
               |       FastAPI Backend Engine     |
               +----------------------------------+
               |  API Router & Auth Middleware    |
               |  Services Layer:                 |
               |   - AuthService (JWT & Google)   |
               |   - BookingService (Spot Lock)   |
               |   - WalletService (Atomic Pay)   |
               |   - QrService (HMAC Engine)      |
               +----------------+-----------------+
                                |
                                | SQLAlchemy ORM 2.0
                                v
               +----------------------------------+
               |       Database (PostgreSQL)      |
               +----------------------------------+
               |  Users, Locations, Slots,        |
               |  Bookings, Wallets, QR Passes     |
               +----------------------------------+
```

## Security & Data Integrity Architecture
1. **JWT & Google OAuth 2.0 Dual Authentication**: Issued standard access tokens (60 min) and refresh tokens (30 days).
2. **Atomic Wallet Operations**: Balance updates and booking payments are wrapped in atomic database transactions to eliminate race conditions.
3. **HMAC-SHA256 Signed QR Pass Verification**: QR passes payload standard: `PARKEASE|{booking_id}|{type}|{valid_until}:{hmac_signature}`. Prevents forged passes and replay attacks.
