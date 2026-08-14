from fastapi import APIRouter
from app.api.v1.api_v1 import api_v1_router

main_router = APIRouter(prefix="/api")
main_router.include_router(api_v1_router)
