from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.response import APIResponse
from app.services.notification_service import notification_service

router = APIRouter()

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: str

@router.get("", response_model=APIResponse)
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get in-app notifications for current user.
    """
    notifications = notification_service.get_user_notifications(db, current_user.id)
    data = [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in notifications
    ]
    return APIResponse(
        success=True,
        message="Notifications retrieved successfully",
        data=data
    )

@router.post("/{notification_id}/read", response_model=APIResponse)
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mark single notification as read.
    """
    notification_service.mark_as_read(db, notification_id, current_user.id)
    return APIResponse(
        success=True,
        message="Notification marked as read",
        data=None
    )

@router.post("/read-all", response_model=APIResponse)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Mark all notifications as read.
    """
    notification_service.mark_all_as_read(db, current_user.id)
    return APIResponse(
        success=True,
        message="All notifications marked as read",
        data=None
    )
