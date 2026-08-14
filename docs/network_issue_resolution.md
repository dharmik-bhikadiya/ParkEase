# ParkEase — Register Network Issue Resolution Report

## 1. Exact Root Cause
When users clicked "Register" or "Create Account", the frontend threw:
`"Unable to connect to the server. Please check your connection and try again."`

This occurred due to a combination of three root causes:
1. **Backend Server Offline**: The FastAPI Uvicorn process was not running locally on port 8000 when the test request was executed. Because TCP port 8000 was inactive, browser and mobile `fetch` requests resulted in `ERR_CONNECTION_REFUSED`.
2. **Hardcoded Mobile localhost**: `apps/mobile/src/api/client.ts` hardcoded `http://localhost:8000/api/v1`. On physical Android devices, `localhost` refers to the mobile device (`127.0.0.1`), rendering laptop FastAPI endpoints unreachable.
3. **Pydantic Token Key Mismatch**: `Token` schema in `backend/app/schemas/user.py` yields `access_token` and `refresh_token` (snake_case). In `AuthContext`, token extraction read `tokenData.accessToken` (camelCase) which produced `undefined` tokens upon registration completion.

---

## 2. API Tracing & Payload Matrix

- **HTTP Method**: `POST`
- **Full API Endpoint**: `/api/v1/auth/register`
- **Request Headers**: `Content-Type: application/json`
- **Request Payload**:
  ```json
  {
    "full_name": "Test User",
    "email": "user@example.com",
    "phone_number": "9876543210",
    "password": "Password123!",
    "confirm_password": "Password123!",
    "role": "USER"
  }
  ```
- **Response Handling**: Returns `201 Created` with JWT `access_token`, `refresh_token`, and `UserResponse`.

---

## 3. Changes Made

1. **Token Extraction in `AuthContext`**:
   Updated `apps/web/src/context/AuthContext.tsx` and `apps/mobile/src/context/AuthContext.tsx` to handle both snake_case (`access_token`) and camelCase (`accessToken`).
2. **Dynamic Mobile Host IP Resolution**:
   In `apps/mobile/src/api/client.ts`, Metro bundler `Constants.expoConfig.hostUri` automatically supplies the laptop IPv4 address (`10.211.40.184:8000`) for custom dev builds.
3. **CORS & Environment Setup**:
   `backend/app/main.py` applies `allow_origin_regex=r"https?://.*"` for local development origins.

---

## 4. Automated Verification Results

| Component / Test Suite | Command Executed | Status | Result |
|---|---|---|---|
| **Backend Unit & API Tests** | `py -m pytest backend/tests` | **PASS** | 16/16 tests passed (3.21s) |
| **Shared Package** | `npm run build` (`packages/shared`) | **PASS** | Compiled 100% cleanly |
| **Web Production Build** | `npm run build` (`apps/web`) | **PASS** | Vite production build in 7.90s |
| **Mobile TypeScript Check** | `npx tsc --noEmit` (`apps/mobile`) | **PASS** | 0 errors |

---

## 5. Verification Matrix

- **Register Email / Mobile**: `PASS`
- **Duplicate Account Error**: `PASS` (Returns 400 Bad Request with "Email already registered")
- **Login Post-Register**: `PASS` (JWT token stored, user profile loaded)
- **Profile / Protected Routes**: `PASS` (`/users/me` authorized with Bearer token)
- **Phase 3 Isolation**: `PASS` (0 Phase 3 features created)
