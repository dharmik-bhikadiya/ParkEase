from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def get_by_phone(self, db: Session, phone_number: str) -> Optional[User]:
        return db.query(User).filter(User.phone_number == phone_number).first()

    def get_by_email_or_phone(self, db: Session, identifier: str) -> Optional[User]:
        return db.query(User).filter(
            (User.email == identifier) | (User.phone_number == identifier)
        ).first()

    def get_all(self, db: Session) -> list[User]:
        return db.query(User).order_by(User.created_at.desc()).all()

    def get_by_role(self, db: Session, role: str) -> list[User]:
        return db.query(User).filter(User.role == role).order_by(User.created_at.desc()).all()

user_repository = UserRepository()
