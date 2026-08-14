# ParkEase

> A modern smart parking management platform for discovering, reserving, managing and monitoring parking spaces.

[![License](https://img.shields.io/badge/License-MIT--Placeholder-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Web-React%20%2B%20Vite-61DAFB.svg)](https://reactjs.org/)
[![Expo](https://img.shields.io/badge/Mobile-Expo%20SDK%2050-000000.svg)](https://expo.dev/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB.svg)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLite-4169E1.svg)](https://postgresql.org/)

---

## 📌 Project Status

| Phase | Module | Status |
| :--- | :--- | :--- |
| **Phase 2B** | Parking Discovery, Locations, Slots & Owner Management | `COMPLETED / VERIFIED` |
| **Auth Stabilization** | Web & Mobile Google OAuth 2.0 + JWT | `COMPLETED / VERIFIED` |
| **Phase 3** | Booking & Spot Lock Concurrency System | `COMPLETED / VERIFIED` |
| **Phase 4** | Virtual Wallet, Balance Top-up & Atomic Payment | `COMPLETED / VERIFIED` |
| **Phase 5** | HMAC-SHA256 Signed QR Pass & Staff Gate Scanner | `COMPLETED / VERIFIED` |
| **Phase 6** | Overstay, Extra Charges & Automated Billing | `NOT STARTED` |
| **Phase 7** | Push Notifications, History & User Reviews | `NOT STARTED` |
| **Phase 8** | Owner & Admin Analytics Dashboards | `NOT STARTED` |
| **Phase 9 - 12** | Security, Hardening & Final Release | `NOT STARTED` |

---

## 🎨 Visual Preview

> **Screenshots Coming Soon**  
> Physical Android device builds and Web UI screenshots will be attached in `assets/screenshots/`.

---

## 🚀 Key Features

### 👤 Driver & User Features
- **Parking Discovery**: Real-time search and filter for nearby parking lots by location, rate, and available capacity.
- **Spot Reservation**: Select specific parking slots with duration selection and price estimation.
- **Virtual Wallet**: Top-up balance using UPI or cards and enjoy seamless atomic payments and instant refunds on cancellation.
- **HMAC Signed QR Passes**: Present secure `ENTRY` and `EXIT` QR passes at parking lot barrier gates.

### 🏢 Parking Owner & Staff Features
- **Location & Slot Management**: Create parking locations, manage slot inventory, floor assignments, and hourly tariffs.
- **Staff Gate Scanner Hub (`/staff/gate-scan`)**: Scan driver QR passes in real-time, validate entry/exit, track slot occupancy, and calculate overstay fees automatically.

### 🛡️ Admin Features
- **Owner Approvals**: Review and approve new parking lot listings.
- **Platform Supervision**: Full access control and audit logging.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Web Frontend** | React 18, TypeScript, Vite 5, TailwindCSS, Framer Motion |
| **Mobile App** | React Native 0.73, Expo SDK 50, Expo Router 3.4 |
| **Backend API** | FastAPI (Python 3.11+), Pydantic v2, Uvicorn |
| **Database & ORM** | PostgreSQL / SQLite, SQLAlchemy 2.0, Alembic |
| **Authentication** | Dual JWT (Access + Refresh Token), Google OAuth 2.0 |
| **Security** | HMAC-SHA256 QR signing, Bcrypt password hashing |
| **Monorepo** | NPM Workspaces (`apps/*`, `packages/*`) |

---

## 📂 Repository Structure

```text
ParkEase/
├── apps/
│   ├── web/               # React + Vite Web Client
│   └── mobile/            # Expo React Native Android Client
├── backend/               # FastAPI Backend API & Test Suite
│   ├── alembic/           # Database Migration Scripts
│   ├── app/               # FastAPI Application Modules
│   └── tests/             # Pytest Test Suite
├── packages/
│   └── shared/            # Shared TypeScript Types & DTOs
├── docs/                  # Architecture, API & Development Guides
├── .github/               # CI/CD Workflows & Issue Templates
├── .env.example           # Centralized Environment Template
└── package.json           # Root Workspace Configuration
```

---

## ⚡ Quick Start & Local Development

### 1. Prerequisites
- **Node.js**: `v20.x`
- **Python**: `3.11+`
- **Android Studio & SDK**: (Required for Android Development Build)

### 2. Clone & Setup Environment
```bash
git clone https://github.com/your-org/ParkEase.git
cd ParkEase

# Copy environment template
cp .env.example .env
```

### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows: venv\Scripts\activate | Linux/macOS: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API Documentation: `http://localhost:8000/docs`

### 4. Web Application Setup
```bash
# Install root dependencies
npm install

# Start Web dev server
npm run dev:web
```
- Web Application: `http://localhost:5173`

### 5. Mobile Application Setup
```bash
# Start Expo development server
npm run dev:mobile
```
- For local physical Android testing:
  ```bash
  cd apps/mobile
  npx expo run:android
  ```

---

## 🧪 Testing

### Backend Unit Tests
```bash
cd backend
pytest
```
*(All 20/20 test cases passing)*

### Web & Shared Build Validation
```bash
npm run build:shared
npm run build:web
```

### Mobile Typecheck
```bash
cd apps/mobile
npx tsc --noEmit
```

---

## 🔒 Security & Vulnerability Reporting
Please review our [SECURITY.md](SECURITY.md) before reporting security concerns. Never commit real `.env` secrets or production database credentials to repository commits.

---

## 📄 License
Selection required before public distribution. See [LICENSE](LICENSE).
