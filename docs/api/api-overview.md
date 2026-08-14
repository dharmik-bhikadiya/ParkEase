# REST API Documentation & Endpoints Overview

All API endpoints are prefixed with `/api/v1`. Interactive Swagger UI is available at `http://localhost:8000/docs`.

---

## Endpoint Summary

### 🔑 Authentication (`/api/v1/auth`)
- `POST /auth/register`: Register new driver/owner account.
- `POST /auth/login`: Authenticate email & password, returns JWT tokens.
- `POST /auth/google`: Authenticate via Google OAuth token.
- `POST /auth/refresh`: Refresh expired JWT access token.

### 🚗 Parking Discovery & Admin (`/api/v1/parking`)
- `GET /parking/locations`: List active parking locations with search & geolocation filters.
- `GET /parking/locations/{id}`: Get location details & slot availability.
- `POST /parking/owner/locations`: Add new parking location (Owner).
- `POST /parking/owner/slots`: Add/update parking slots (Owner).
- `POST /parking/admin/locations/{id}/approve`: Approve location listing (Admin).

### 📅 Booking System (`/api/v1/booking`)
- `POST /booking/`: Reserve a parking slot for specified duration.
- `GET /booking/my-bookings`: Retrieve user reservation history.
- `POST /booking/{id}/cancel`: Cancel booking & trigger wallet refund.

### 💳 Wallet System (`/api/v1/wallet`)
- `GET /wallet/`: Retrieve current user wallet balance.
- `POST /wallet/topup`: Add funds via UPI / simulated card gateway.
- `POST /wallet/pay`: Atomically pay for booking.
- `GET /wallet/transactions`: Retrieve transaction history.

### 🛡️ QR Pass & Session Management (`/api/v1/qr`)
- `GET /qr/passes/{booking_id}`: Retrieve signed `ENTRY` and `EXIT` QR passes.
- `POST /qr/scan-entry`: Staff/Gate Scanner entry verification endpoint.
- `POST /qr/scan-exit`: Staff/Gate Scanner exit verification endpoint.
