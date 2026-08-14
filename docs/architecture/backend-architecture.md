# Backend Architecture (`backend/`)

## Technologies & Stack
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.0
- **Database Migrations**: Alembic
- **Testing**: Pytest
- **Security**: PyJWT, Passlib (Bcrypt), HMAC SHA256

## Module Organization
```text
backend/app/
├── api/
│   ├── deps.py              # Dependency injection (db session, current_user)
│   └── v1/
│       └── endpoints/       # REST API endpoints (auth, parking, booking, wallet, qr)
├── core/
│   ├── config.py            # App settings (Pydantic BaseSettings)
│   ├── database.py          # SQLAlchemy Session Maker & Base
│   └── security.py          # Password hashing & JWT tokens
├── models/                  # SQLAlchemy DB models (User, Parking, Booking, Wallet, QR)
├── schemas/                 # Pydantic DTOs for request/response validation
└── services/                # Business logic services (AuthService, BookingService, WalletService, QrService)
```
