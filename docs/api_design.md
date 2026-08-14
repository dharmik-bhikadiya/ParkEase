# ParkEase REST API Specification

All endpoints are prefixed with `/api/v1`.

---

## Endpoint Catalog

### System
- `GET /health` - Service health status check

### Authentication (`/auth`)
- `POST /auth/register` - Create user account
- `POST /auth/login` - Authenticate user & receive JWT token

### Parking Locations & Slots (`/parking`)
- `GET /parking/locations?city={city}` - List open parking locations filtered by city
- `GET /parking/locations/{id}` - Details of specific parking lot
- `GET /parking/locations/{id}/slots` - Availability of parking slots

### Bookings (`/bookings`)
- `POST /bookings` - Create new parking reservation
- `GET /bookings/user` - List user reservations
- `GET /bookings/{id}` - Reservation detail
- `POST /bookings/{id}/cancel` - Cancel pending reservation

### Digital Wallet (`/wallet`)
- `GET /wallet/balance` - Check wallet balance
- `POST /wallet/topup` - Add funds to wallet
- `GET /wallet/transactions` - Transaction history

### QR Barrier Gate Pass (`/qr`)
- `GET /qr/entry/{booking_id}` - Generate entry gate QR pass
- `GET /qr/exit/{booking_id}` - Generate exit gate QR pass
- `POST /qr/verify` - Barrier scanner verification
