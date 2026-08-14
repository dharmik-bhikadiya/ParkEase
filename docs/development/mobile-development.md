# Mobile Development Guide (`apps/mobile`)

## Stack & Versions
- **Expo SDK**: 50.0.21
- **Expo Router**: 3.4.10
- **React Native**: 0.73.6
- **Package Name**: `com.parkease.app`

## Environment Setup
Environment variables are defined in `.env` and exposed via Expo's `EXPO_PUBLIC_` prefix:
- `EXPO_PUBLIC_API_BASE_URL`: Base API URL pointing to local server machine IP (e.g. `http://192.168.1.100:8000/api/v1`).
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`: OAuth Client ID for mobile auth flow.

## Commands
- Start Metro Bundler: `npx expo start`
- Android Local Build: `npx expo run:android`
- Typecheck: `npx tsc --noEmit`
