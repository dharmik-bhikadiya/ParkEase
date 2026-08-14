# Changelog

All notable changes to the **ParkEase** monorepo platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-14

### Added
- **Monorepo Architecture**: Setup unified workspace supporting FastAPI backend, Vite React web client, Expo React Native mobile client, and shared TypeScript types package.
- **Phase 2B Baseline**: Parking discovery, search, location management, parking spot details, and owner slot configuration.
- **Authentication**: Dual JWT authentication flow supporting both standard email/password and Google OAuth 2.0 (Web + Mobile physical device support).
- **Phase 3 (Booking System)**: End-to-end parking reservation service, slot lock concurrency control, booking list, cancellation lifecycle.
- **Phase 4 (Wallet & Payment)**: Virtual wallet service, UPI/Card balance top-up, atomic booking payment deduction, and automatic cancellation refund workflow.
- **Phase 5 (QR & Session Management)**: HMAC-SHA256 signed QR pass engine (`ENTRY`/`EXIT`), Staff Gate Scanner Hub (`/staff/gate-scan`), session status transitions (`CONFIRMED` → `ACTIVE` → `COMPLETED`), automatic slot status toggling (`AVAILABLE` ↔ `OCCUPIED`), and anti-replay protection.
- **GitHub Preparation**: Repository standardization, CI workflows, security policies, documentation hierarchy, issue templates, and environment templates.
