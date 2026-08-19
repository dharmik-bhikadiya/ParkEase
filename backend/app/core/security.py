import re
import secrets
import hashlib
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional, Tuple
from jose import jwt, JWTError
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": str(role),
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any]) -> Tuple[str, str, datetime]:
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    raw_token = secrets.token_urlsafe(48)
    token_hash = hash_token(raw_token)
    return raw_token, token_hash, expires_at

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

def decode_supabase_token(token: str) -> Optional[dict]:
    """
    Securely decodes and verifies a Supabase Auth access token.
    Validates signature, expiration time (exp), and token structure.
    Signature verification is STRICTLY ENFORCED.
    """
    secrets_to_try = []
    if settings.SUPABASE_JWT_SECRET and settings.SUPABASE_JWT_SECRET.strip():
        secrets_to_try.append(settings.SUPABASE_JWT_SECRET.strip())
    if settings.JWT_SECRET_KEY and settings.JWT_SECRET_KEY not in secrets_to_try:
        secrets_to_try.append(settings.JWT_SECRET_KEY)

    for secret in secrets_to_try:
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=[settings.JWT_ALGORITHM],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": False,
                }
            )
            if payload and "sub" in payload and payload["sub"]:
                return payload
        except JWTError:
            continue

    return None

def validate_strong_password(password: str) -> Tuple[bool, Optional[str]]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number"
    return True, None

def validate_phone_number(phone: str) -> bool:
    cleaned = re.sub(r"[\s\-\(\)\+]", "", phone)
    return len(cleaned) >= 10 and cleaned.isdigit()
