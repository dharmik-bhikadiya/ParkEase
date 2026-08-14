# Mobile Architecture (`apps/mobile`)

## Technologies & Stack
- **Framework**: Expo SDK 50 & React Native 0.73.6
- **Routing**: Expo Router 3.4.10 (File-based navigation)
- **Language**: TypeScript
- **Target Platform**: Android (Physical Device Development Build)

## Navigation Structure
- `app/_layout.tsx`: Root layout provider & AuthProvider wrapper.
- `app/(auth)/`: Unauthenticated screens (`login.tsx`, `register.tsx`).
- `app/(app)/`: Authenticated application screens:
  - `(tabs)/index.tsx`: Home Dashboard.
  - `find-parking.tsx`: Interactive parking search screen.
  - `my-bookings.tsx`: Reservations & QR Pass Modal.
  - `wallet.tsx`: Virtual Wallet & Transactions.
  - `profile.tsx`: Driver Profile & Vehicles.
