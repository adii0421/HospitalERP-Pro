"""
Staff service - non-doctor employee management and leave request workflow.
"""
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.staff import Staff
from app.repositories.department_repository import DepartmentRepository
from app.repositories.staff_repository import LeaveRequestRepository, StaffRepository
from app.schemas.staff import (
    LeaveRequestCreate,
    LeaveRequestOut,
    LeaveRequestUpdate,
    StaffCreate,
    StaffOut,
    StaffUpdate,
)


class StaffService:
    def __init__(self, db: Session):
        self.repo = StaffRepository(db)
        self.dept_repo = DepartmentRepository(db)

    def _to_out(self, staff: Staff) -> StaffOut:
        out = StaffOut.model_validate(staff)
        out.department_name = staff.department.name if staff.department else None
        return out

    def list(self, skip: int = 0, limit: int = 100) -> List[StaffOut]:
        return [self._to_out(s) for s in self.repo.get_all(skip, limit)]

    def get(self, staff_id: int) -> Staff:
        staff = self.repo.get(staff_id)
        if not staff:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")
        return staff

    def get_out(self, staff_id: int) -> StaffOut:
        return self._to_out(self.get(staff_id))

    def create(self, payload: StaffCreate) -> StaffOut:
        if self.repo.get_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        if payload.department_id and not self.dept_repo.get(payload.department_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid department_id")
        staff = self.repo.create(payload.model_dump())
        return self._to_out(staff)

    def update(self, staff_id: int, payload: StaffUpdate) -> StaffOut:
        staff = self.get(staff_id)
        staff = self.repo.update(staff, payload.model_dump(exclude_unset=True))
        return self._to_out(staff)

    def delete(self, staff_id: int) -> None:
        staff = self.get(staff_id)
        self.repo.delete(staff)


class LeaveRequestService:
    def __init__(self, db: Session):
        self.repo = LeaveRequestRepository(db)
        self.staff_repo = StaffRepository(db)

    def _to_out(self, leave) -> LeaveRequestOut:
        out = LeaveRequestOut.model_validate(leave)
        out.staff_name = leave.staff.full_name if leave.staff else None
        return out

    def list(self, skip: int = 0, limit: int = 100) -> List[LeaveRequestOut]:
        return [self._to_out(l) for l in self.repo.get_all(skip, limit)]

    def get(self, leave_id: int):
        leave = self.repo.get(leave_id)
        if not leave:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
        return leave

    def create(self, payload: LeaveRequestCreate) -> LeaveRequestOut:
        if not self.staff_repo.get(payload.staff_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid staff_id")
        leave = self.repo.create(payload.model_dump())
        return self._to_out(leave)

    def update(self, leave_id: int, payload: LeaveRequestUpdate) -> LeaveRequestOut:
        leave = self.get(leave_id)
        leave = self.repo.update(leave, payload.model_dump(exclude_unset=True))
        return self._to_out(leave)

    def delete(self, leave_id: int) -> None:
        leave = self.get(leave_id)
        self.repo.delete(leave)
