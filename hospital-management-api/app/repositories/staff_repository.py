"""
Repository for Staff and LeaveRequest entities.
"""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.staff import Staff, LeaveRequest
from app.repositories.base import BaseRepository


class StaffRepository(BaseRepository[Staff, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(Staff, db)

    def get_by_email(self, email: str) -> Optional[Staff]:
        stmt = select(Staff).where(Staff.email == email)
        return self.db.scalars(stmt).first()

    def get_by_department(self, department_id: int) -> List[Staff]:
        stmt = select(Staff).where(Staff.department_id == department_id)
        return list(self.db.scalars(stmt).all())


class LeaveRequestRepository(BaseRepository[LeaveRequest, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(LeaveRequest, db)

    def get_by_staff(self, staff_id: int) -> List[LeaveRequest]:
        stmt = select(LeaveRequest).where(LeaveRequest.staff_id == staff_id)
        return list(self.db.scalars(stmt).all())
