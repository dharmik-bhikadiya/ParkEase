# Web Development Guide (`apps/web`)

## Available Scripts
Inside `apps/web`:
- `npm run dev`: Start Vite development server with Hot Module Replacement (`http://localhost:5173`).
- `npm run build`: Typecheck with `tsc` and create production bundle in `dist/`.
- `npm run preview`: Serve production bundle locally.

## API Integration
The web application uses the central Axios `apiClient` (`apps/web/src/api/client.ts`).
The base URL is injected via environment variable `VITE_API_BASE_URL` (default: `http://localhost:8000/api/v1`).
