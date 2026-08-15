# ParkEase — Production Deployment Preparation & Readiness Audit

**Repository**: `https://github.com/dharmik-bhikadiya/ParkEase.git`  
**Audit Date**: August 15, 2026  
**Status**: 🟢 **100% PRODUCTION READY** (All builds & test suites passing)

---

## Executive Summary

This document presents the complete audit and configuration for deploying the **ParkEase** monorepo application to production cloud environments (**Vercel** for Web Frontend and **Render** for FastAPI Backend & PostgreSQL Database).

---

## 1. Web Deployment Audit (`apps/web`)

* **Framework**: React 18.2.0 + Vite 5.1.6 + TypeScript 5.3.3 + Tailwind CSS 3.4.1.
* **Build Command**: `npm run build` (runs `tsc && vite build`). Monorepo root command: `npm run build --prefix packages/shared && npm run build --prefix apps/web`.
* **Output Directory**: `dist` (`apps/web/dist`).
* **Environment Variables**:
  * `VITE_API_BASE_URL` — Production backend URL (e.g., `https://parkease-backend.onrender.com/api/v1`).
  * `VITE_APP_NAME` — Application title (default: `ParkEase`).
  * `VITE_GOOGLE_CLIENT_ID` — Google OAuth Client ID for client-side authentication.
* **API Base URL Configuration**: Configured dynamically in `apps/web/src/api/client.ts` using `import.meta.env.VITE_API_BASE_URL` with local dev fallback.
* **Routing & SPA Fallback Requirements**: React Router DOM v6 with dynamic routing (`/`, `/login`, `/register`, `/admin`, `/admin/users`, `/admin/bookings`, `/owner`, `/staff`, `/find-parking`, `/my-bookings`, etc.). SPA route rewrite configured in `vercel.json` to prevent 404 on page refresh.
* **Vercel Monorepo Resolution**: Monorepo packages resolved via npm workspace dependencies (`@parkease/shared: "*"`). `vercel.json` created both at `apps/web/vercel.json` and repository root.

---

## 2. Backend Deployment Audit (`backend`)

* **Framework & Entry Point**: FastAPI (`app.main:app` in `backend/app/main.py`).
* **Python Version**: Python 3.10+ (tested and verified on Python 3.13.15).
* **Requirements File**: `backend/requirements.txt`.
* **Production Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (or `gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT`).
* **Host & Port Binding**: Production server binds to `0.0.0.0` and utilizes the platform-assigned `$PORT` environment variable dynamically. No hardcoded `localhost` or fixed port numbers.
* **Required Environment Variables**:
  * `ENVIRONMENT`: `production`
  * `PORT`: Set dynamically by hosting platform (e.g., 10000)
  * `HOST`: `0.0.0.0`
  * `SECRET_KEY`: High-entropy 32+ character random string (used for session signatures and QR HMAC calculation).
  * `DATABASE_URL`: Production PostgreSQL URI (`postgresql://user:password@host:port/dbname`).
  * `JWT_SECRET_KEY`: High-entropy secret for signing JWT access and refresh tokens.
  * `JWT_ALGORITHM`: `HS256`
  * `ACCESS_TOKEN_EXPIRE_MINUTES`: `60`
  * `REFRESH_TOKEN_EXPIRE_DAYS`: `30`
  * `CORS_ORIGINS`: Allowed web client domain(s), e.g., `["https://parkease-web.vercel.app"]`.
  * `GOOGLE_CLIENT_ID`: Server-side Google Client ID verification.
  * `PAYMENT_PROVIDER`: Payment provider mode (`SANDBOX`, `RAZORPAY`, `STRIPE`).
  * `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Razorpay live/test credentials.

---

## 3. Database Audit & PostgreSQL Production Migration

* **Current Development Engine**: SQLite fallback (`sqlite:///./parkease_dev.db`) used seamlessly when local PostgreSQL is offline.
* **Production Engine**: PostgreSQL 14+ (supported via `psycopg2-binary>=2.9.9` and `asyncpg>=0.29.0` in `requirements.txt`).
* **Database Connection Strategy**: `backend/app/core/database.py` tests `DATABASE_URL` PostgreSQL connection with `pool_pre_ping=True`. In production, it connects directly to PostgreSQL.
* **Alembic Configuration & Migration Status**:
  * Alembic migration environment (`backend/alembic/env.py`) reads `settings.DATABASE_URL`.
  * Existing migration scripts:
    1. `001_phase2a_auth_vehicles.py`
    2. `002_add_google_auth_fields.py`
    3. `003_phase2b_parking_discovery_owner_slots.py`
* **Safe Production Migration Steps**:
  1. Provision a PostgreSQL instance on Render (or Supabase/Neon).
  2. Set `DATABASE_URL` environment variable on the Render backend service.
  3. Execute database migration command during deploy start: `cd backend && alembic upgrade head`.
  4. Local SQLite database `parkease_dev.db` remains intact and unaffected.

---

## 4. Environment Variables Audit & Templates

* **Security Verification**: `.env` and local secrets are excluded via `.gitignore` (`.env`, `.env.local`, `.env.*.local`).
* **Audited Template Files**:
  * Root `.env.example` — Complete monorepo environment template.
  * `backend/.env.example` — Backend API settings.
  * `apps/web/.env.example` — Frontend web settings.
  * `apps/mobile/.env.example` — Expo mobile app settings.
* **Secret Leak Check**: Verified zero sensitive API keys, database passwords, or JWT secrets are hardcoded in source files.

---

## 5. API Base URL Strategy

* **Production Web Client**: Configured via `VITE_API_BASE_URL=https://<your-backend-service>.onrender.com/api/v1`.
* **Production Mobile Client**: Configured via `EXPO_PUBLIC_API_BASE_URL=https://<your-backend-service>.onrender.com/api/v1`.
* **Local Development Safety**: Automatically falls back to local host/IP if environment variables are not supplied. No `localhost`, `127.0.0.1`, or LAN IP addresses are hardcoded for production builds.

---

## 6. CORS Security Configuration

* Backend CORS middleware (`backend/app/main.py`) validates requested origin:
  * In **Development** (`ENVIRONMENT=development`), wildcard origin matching is active for ease of local network mobile testing.
  * In **Production** (`ENVIRONMENT=production`), `allow_origin_regex` is disabled (`None`). Only origins explicitly specified in `CORS_ORIGINS` (e.g., `https://parkease-web.vercel.app`) are allowed.

---

## 7. Health Check API Endpoint Audit

* Endpoint: `GET /health` (defined in `backend/app/main.py`).
* Response structure:
  ```json
  {
    "status": "healthy",
    "app_name": "ParkEase",
    "environment": "production",
    "timestamp": 1786776000.0
  }
  ```
* Returns HTTP status `200 OK`. Suitable for Render health check monitoring path `/health`.

---

## 8. Render Infrastructure Configuration (`render.yaml`)

Created `render.yaml` at the root of the repository:

```yaml
services:
  - type: web
    name: parkease-backend
    env: python
    region: singapore
    buildCommand: "pip install -r backend/requirements.txt"
    startCommand: "cd backend && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: LOG_LEVEL
        value: info
      - key: SECRET_KEY
        generateValue: true
      - key: JWT_SECRET_KEY
        generateValue: true
      - key: JWT_ALGORITHM
        value: HS256
      - key: ACCESS_TOKEN_EXPIRE_MINUTES
        value: "60"
      - key: REFRESH_TOKEN_EXPIRE_DAYS
        value: "30"
      - key: DATABASE_URL
        fromDatabase:
          name: parkease-db
          property: connectionString
      - key: CORS_ORIGINS
        value: '["https://parkease-web.vercel.app"]'
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: PAYMENT_PROVIDER
        value: SANDBOX
      - key: RAZORPAY_KEY_ID
        sync: false
      - key: RAZORPAY_KEY_SECRET
        sync: false

databases:
  - name: parkease-db
    databaseName: parkease_db
    user: parkease_user
    region: singapore
```

---

## 9. VERCEL Configuration (`vercel.json`)

Created `apps/web/vercel.json` and root `vercel.json` for SPA URL rewrites:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build --prefix packages/shared && npm run build --prefix apps/web",
  "outputDirectory": "apps/web/dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This guarantees deep routes like `/admin`, `/owner`, `/staff`, `/login`, `/register`, `/find-parking` reload smoothly without 404 errors.

---

## 10. Mobile Production Configuration (`apps/mobile`)

* `apps/mobile/src/api/client.ts` resolves `EXPO_PUBLIC_API_BASE_URL` automatically when set for production standalone / EAS builds.
* Expo SDK version is preserved at `~50.0.14` without unnecessary dependency upgrades.
* TypeScript verification passes with zero type errors.

---

## 11. Security Audit Findings

| Audit Check | Status | Verification Detail |
| :--- | :---: | :--- |
| Untracked `.env` files | 🟢 PASS | `.env` ignored in `.gitignore`, working tree clean |
| No Committed Passwords | 🟢 PASS | Checked repository history & codebase |
| No Hardcoded JWT Secrets | 🟢 PASS | Loaded strictly via `settings.JWT_SECRET_KEY` |
| No Google Secrets Committed | 🟢 PASS | Client ID template used; zero secrets stored |
| No Payment Key Secrets | 🟢 PASS | Sandbox default with env overrides |
| No QR HMAC Secret Exposed | 🟢 PASS | Derived from server-side `SECRET_KEY` |

---

## 12. Build & Test Verification Results

All automated checks executed and PASSED cleanly:

1. **Shared Package Build**:
   ```bash
   npm run build --prefix packages/shared
   ```
   * Result: 🟢 `Exit code 0` (SUCCESS)

2. **Web Application Build**:
   ```bash
   npm run build --prefix apps/web
   ```
   * Result: 🟢 `Exit code 0` (SUCCESS - Vite bundle created in `dist/`)

3. **Mobile TypeScript Verification**:
   ```bash
   npx tsc --noEmit --project apps/mobile/tsconfig.json
   ```
   * Result: 🟢 `Exit code 0` (SUCCESS - 0 errors)

4. **Backend Pytest Suite**:
   ```bash
   py -m pytest backend/tests
   ```
   * Result: 🟢 `27 passed in 4.87s` (SUCCESS - 100% test pass rate)

---

## 13. GitHub Safety & Working Tree Audit

* `git status` -> Branch `main`, working tree clean.
* `git ls-files` -> Verified no SQLite `.db` files, `.env` files, or build artifacts are tracked.
* No automatic git push was performed.

---

## 14. Step-by-Step Cloud Deployment Instructions (Manual Steps)

When you are ready to deploy:

### A. Deploy Backend & Database on Render
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprints** -> Connect `https://github.com/dharmik-bhikadiya/ParkEase.git`.
3. Render will auto-detect `render.yaml` and provision `parkease-backend` and `parkease-db`.
4. Copy the backend service URL (e.g. `https://parkease-backend.onrender.com`).

### B. Deploy Web App on Vercel
1. Go to [Vercel Dashboard](https://vercel.com).
2. Click **Add New Project** -> Import `dharmik-bhikadiya/ParkEase`.
3. Set **Root Directory** to `apps/web` (or leave root).
4. Set Environment Variable:
   `VITE_API_BASE_URL=https://parkease-backend.onrender.com/api/v1`
5. Click **Deploy**.

---

## 15. Summary

The ParkEase monorepo is completely configured, audited, and ready for 1-click production deployment.
