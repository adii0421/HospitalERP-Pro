"""
Repository for Department entity.
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.repositories.base import BaseRepository


class DepartmentRepository(BaseRepository[Department, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(Department, db)

    def get_by_name(self, name: str) -> Optional[Department]:
        stmt = select(Department).where(Department.name == name)
        return self.db.scalars(stmt).first()
