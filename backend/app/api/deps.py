from typing import Generator, List, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.repositories.user_repository import user_repository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    user = user_repository.get_by_id(db, user_id)
    if user is None:
        raise credentials_exception
        
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive or suspended account"
        )
    return current_user

def require_roles(allowed_roles: List[UserRole]) -> Callable:
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        # Normalize role checks (handle DRIVER <-> USER and STAFF <-> PARKING_STAFF aliases)
        effective_role = current_user.role
        role_matches = False
        
        for allowed in allowed_roles:
            if effective_role == allowed:
                role_matches = True
                break
            if allowed in [UserRole.USER, UserRole.DRIVER] and effective_role in [UserRole.USER, UserRole.DRIVER]:
                role_matches = True
                break
            if allowed in [UserRole.PARKING_STAFF, UserRole.STAFF] and effective_role in [UserRole.PARKING_STAFF, UserRole.STAFF]:
                role_matches = True
                break
                
        if not role_matches:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role}' is not authorized to access this resource"
            )
        return current_user
        
    return role_checker
