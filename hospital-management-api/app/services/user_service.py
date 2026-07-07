"""
User management service (admin CRUD over system accounts).
"""
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def list(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.repo.get_all(skip, limit)

    def get(self, user_id: int) -> User:
        user = self.repo.get(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    def create(self, payload: UserCreate) -> User:
        if self.repo.get_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        data = payload.model_dump(exclude={"password"})
        data["hashed_password"] = hash_password(payload.password)
        return self.repo.create(data)

    def update(self, user_id: int, payload: UserUpdate) -> User:
        user = self.get(user_id)
        data = payload.model_dump(exclude_unset=True, exclude={"password"})
        if payload.password:
            data["hashed_password"] = hash_password(payload.password)
        return self.repo.update(user, data)

    def delete(self, user_id: int) -> None:
        user = self.get(user_id)
        self.repo.delete(user)
