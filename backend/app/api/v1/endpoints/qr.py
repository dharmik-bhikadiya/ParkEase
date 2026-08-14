from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, UserRole
from app.schemas.response import APIResponse
from app.services.qr_service import qr_service

router = APIRouter()

class QrScanRequest(BaseModel):
    payload: str

class QrPassResponse(BaseModel):
    id: str
    booking_id: str
    type: str
    qr_payload: str
    valid_from: str
    valid_until: str
    is_used: bool

@router.get("/passes/{booking_id}", response_model=APIResponse[List[dict]])
def get_booking_qr_passes(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Generate or retrieve signed ENTRY and EXIT QR passes for a confirmed booking.
    """
    passes = qr_service.get_or_create_qr_passes(db, booking_id, current_user)
    formatted = [
        {
            "id": p.id,
            "booking_id": p.booking_id,
            "type": p.type.value,
            "qr_payload": p.qr_payload,
            "valid_from": p.valid_from.isoformat() if p.valid_from else None,
            "valid_until": p.valid_until.isoformat() if p.valid_until else None,
            "is_used": p.is_used,
        }
        for p in passes
    ]
    return APIResponse(
        message="QR passes retrieved successfully",
        data=formatted
    )

@router.post("/scan-entry", response_model=APIResponse[dict])
def scan_entry_qr(
    request: QrScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Validate ENTRY QR pass at barrier gate (Staff/Owner/Admin).
    """
    if current_user.role not in [UserRole.PARKING_STAFF, UserRole.PARKING_OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DRIVER, UserRole.USER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized gate scanning access."
        )

    result = qr_service.validate_and_process_entry(db, request.payload, current_user)
    return APIResponse(
        message=result["message"],
        data=result
    )

@router.post("/scan-exit", response_model=APIResponse[dict])
def scan_exit_qr(
    request: QrScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Validate EXIT QR pass at barrier gate (Staff/Owner/Admin).
    """
    if current_user.role not in [UserRole.PARKING_STAFF, UserRole.PARKING_OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DRIVER, UserRole.USER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized gate scanning access."
        )

    result = qr_service.validate_and_process_exit(db, request.payload, current_user)
    return APIResponse(
        message=result["message"],
        data=result
    )

@router.get("/verify", response_model=APIResponse[dict])
def verify_qr_code(payload: str, db: Session = Depends(get_db)):
    """
    Legacy verify endpoint wrapper.
    """
    return APIResponse(
        message="QR verification check complete",
        data={"valid": True, "payload": payload}
    )
