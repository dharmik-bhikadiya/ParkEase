# Local Development Guide

## Environment Requirements
- **Node.js**: `v20.20.2`
- **npm**: `10.8.2`
- **Python**: `3.11+`
- **Android Studio & SDK**: Android 14 SDK (API 34), Build Tools `34.0.0`, JDK 17

---

## Workspace Setup

1. **Clone Monorepo & Install Dependencies**
   ```bash
   git clone https://github.com/your-org/ParkEase.git
   cd ParkEase
   npm install
   ```

2. **Configure Environment File**
   ```bash
   cp .env.example .env
   ```

3. **Start All Services**
   - **Backend**:
     ```bash
     cd backend
     python -m venv venv
     # Activate venv
     pip install -r requirements.txt
     alembic upgrade head
     uvicorn app.main:app --reload --port 8000
     ```
   - **Web App**:
     ```bash
     npm run dev:web
     ```
   - **Mobile App**:
     ```bash
     npm run dev:mobile
     ```
