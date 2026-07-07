"""
Department management service.
"""
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.department import Department
from app.repositories.department_repository import DepartmentRepository
from app.schemas.department import DepartmentCreate, DepartmentOut, DepartmentUpdate


class DepartmentService:
    def __init__(self, db: Session):
        self.repo = DepartmentRepository(db)

    def _to_out(self, dept: Department) -> DepartmentOut:
        out = DepartmentOut.model_validate(dept)
        out.doctor_count = len(dept.doctors) if dept.doctors is not None else 0
        return out

    def list(self, skip: int = 0, limit: int = 100) -> List[DepartmentOut]:
        return [self._to_out(d) for d in self.repo.get_all(skip, limit)]

    def get(self, dept_id: int) -> Department:
        dept = self.repo.get(dept_id)
        if not dept:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
        return dept

    def get_out(self, dept_id: int) -> DepartmentOut:
        return self._to_out(self.get(dept_id))

    def create(self, payload: DepartmentCreate) -> DepartmentOut:
        if self.repo.get_by_name(payload.name):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department name already exists")
        dept = self.repo.create(payload.model_dump())
        return self._to_out(dept)

    def update(self, dept_id: int, payload: DepartmentUpdate) -> DepartmentOut:
        dept = self.get(dept_id)
        dept = self.repo.update(dept, payload.model_dump(exclude_unset=True))
        return self._to_out(dept)

    def delete(self, dept_id: int) -> None:
        dept = self.get(dept_id)
        self.repo.delete(dept)
