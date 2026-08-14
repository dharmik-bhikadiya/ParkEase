# ParkEase System Architecture Blueprint

This document details the architectural layout, communication patterns, and design principles governing **ParkEase**.

---

## 1. System Topology & Monorepo Layout

```
                  ┌────────────────────────┐
                  │    ParkEase Web        │
                  │ (React + Vite + TW)    │
                  └───────────┬────────────┘
                              │
                              │ REST APIs (JSON / HTTPS)
                              ▼
┌───────────────────────────────────────────────────────────┐
│                    FastAPI Backend                        │
│ ┌───────────────┐ ┌────────────────┐ ┌──────────────────┐ │
│ │  API Routers  │ │ Service Layer  │ │ Repositories     │ │
│ └───────┬───────┘ └───────┬────────┘ └────────┬─────────┘ │
└─────────┼─────────────────┼───────────────────┼───────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌───────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                      │
│ (users, parking_locations, slots, bookings, wallets, qr) │
└───────────────────────────────────────────────────────────┘
                              ▲
                              │ REST APIs (JSON / HTTPS)
                              │
                  ┌───────────┴────────────┐
                  │    ParkEase Mobile     │
                  │ (React Native + Expo)  │
                  └────────────────────────┘
```

---

## 2. Core Architectural Rules

1. **Single Source of Truth**: All business logic (pricing, slot locking, overstay penalties, QR signature generation, wallet deductions) lives exclusively within the **FastAPI Backend Service**.
2. **Unified Database**: Both Web and Mobile clients share the same PostgreSQL database instance.
3. **Shared Contract (`@parkease/shared`)**: Data types, API route endpoints, and brand color tokens are centralized to prevent specification drift between Web and Mobile.
4. **Stateless JWT Security**: Authentication state is stored in JWT tokens passed via Authorization headers (`Bearer <token>`).

---

## 3. Communication Patterns

- **HTTP REST APIs**: JSON request & response payloads following standard status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`).
- **QR Access Code Flow**:
  1. Client requests QR Pass for confirmed booking.
  2. Backend generates signed HMAC token containing `booking_id`, `valid_from`, and `valid_until`.
  3. Client displays QR code.
  4. Gate Barrier Scanner posts QR string to `/api/v1/qr/verify` for validation.
