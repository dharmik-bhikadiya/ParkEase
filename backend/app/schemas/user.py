from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    email_or_phone: str
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class CreatePasswordRequest(BaseModel):
    new_password: str
    confirm_password: str

class ForgotPasswordRequest(BaseModel):
    email_or_phone: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class GoogleAuthRequest(BaseModel):
    id_token: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None
    auth_provider: Optional[str] = "email"
    has_password: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
