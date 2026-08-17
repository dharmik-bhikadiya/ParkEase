import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.router import main_router

app = FastAPI(
    title=settings.APP_NAME,
    description="ParkEase - Professional Online Parking Reservation Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

from fastapi.exceptions import RequestValidationError, HTTPException

# Configure CORS Middleware for Web & Mobile Development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app|https?://localhost:.*|https?://127\.0\.0\.1:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Process time logging middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Health check route
@app.get("/health", tags=["System Health"])
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time(),
    }

# Include Main API Router
app.include_router(main_router)

def _get_cors_headers(request: Request) -> dict:
    headers = {}
    origin = request.headers.get("origin")
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "*"
        headers["Access-Control-Allow-Headers"] = "*"
    return headers

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail if isinstance(exc.detail, str) else "Request failed",
            "detail": exc.detail,
            "error": {"details": exc.detail},
        },
        headers=_get_cors_headers(request),
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation error occurred",
            "detail": exc.errors(),
            "error": {"details": exc.errors()},
        },
        headers=_get_cors_headers(request),
    )

# Global Unhandled Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    status_code = getattr(exc, "status_code", 500)
    detail = getattr(exc, "detail", str(exc))
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": detail if isinstance(detail, str) else "Internal server error occurred",
            "detail": detail,
            "error": {"details": detail},
        },
        headers=_get_cors_headers(request),
    )
