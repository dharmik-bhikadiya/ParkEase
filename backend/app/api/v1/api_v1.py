from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, parking, admin_parking, booking, wallet, qr, payments, notifications

api_v1_router = APIRouter(prefix="/v1")

api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(users.router, prefix="/users", tags=["User Profiles & Vehicles"])
api_v1_router.include_router(parking.router, prefix="/parking", tags=["Parking Locations & Slots"])
api_v1_router.include_router(admin_parking.router, prefix="/admin", tags=["Admin Operations"])
api_v1_router.include_router(admin_parking.router, prefix="/admin/parking", tags=["Admin Operations Legacy"])
api_v1_router.include_router(booking.router, prefix="/bookings", tags=["Bookings & Reservations"])
api_v1_router.include_router(wallet.router, prefix="/wallet", tags=["Digital Wallet & Payments"])
api_v1_router.include_router(qr.router, prefix="/qr", tags=["QR Barrier Gate Access"])
api_v1_router.include_router(payments.router, prefix="/payments", tags=["Payment Gateway & Orders"])
api_v1_router.include_router(notifications.router, prefix="/notifications", tags=["Notification Center"])
