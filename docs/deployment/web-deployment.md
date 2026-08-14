# Web Deployment Guide

## Static Hosting Deployment (Vercel / Netlify / AWS S3 + CloudFront)

### Build Settings
- **Build Command**: `npm run build:web` (or `cd apps/web && npm run build`)
- **Output Directory**: `apps/web/dist`
- **Node Version**: `20.x`

### Environment Variables
Configure the following environment variables in your deployment dashboard:
- `VITE_APP_NAME`: `ParkEase`
- `VITE_API_BASE_URL`: `https://api.yourdomain.com/api/v1`
- `VITE_GOOGLE_CLIENT_ID`: `your-production-google-client-id.apps.googleusercontent.com`
