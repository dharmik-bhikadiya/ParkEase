# Backend Deployment Guide (FastAPI + PostgreSQL)

## Production Requirements
- **Python**: `3.11+`
- **WSGI / ASGI Server**: Uvicorn / Gunicorn with Uvicorn workers (`gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app`)
- **Database**: PostgreSQL 14+ managed instance (AWS RDS, Render PostgreSQL, DigitalOcean Managed Database)
- **SSL Certificate**: HTTPS enabled via Nginx / Cloudflare reverse proxy

## Environment Variables Checklist
- `ENVIRONMENT`: `production`
- `SECRET_KEY`: High-entropy 64-character random string
- `JWT_SECRET_KEY`: High-entropy secret key
- `DATABASE_URL`: `postgresql://user:password@db-host:5432/parkease_prod_db`
- `CORS_ORIGINS`: `["https://parkease.yourdomain.com"]`

## Startup Commands
```bash
# Apply database migrations
alembic upgrade head

# Start production server
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```
- Healthcheck Endpoint: `GET /health`
