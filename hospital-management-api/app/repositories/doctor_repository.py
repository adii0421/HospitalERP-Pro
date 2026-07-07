"""
Repository for Doctor and DoctorSchedule entities.
"""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.doctor import Doctor, DoctorSchedule
from app.repositories.base import BaseRepository


class DoctorRepository(BaseRepository[Doctor, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(Doctor, db)

    def get_by_email(self, email: str) -> Optional[Doctor]:
        stmt = select(Doctor).where(Doctor.email == email)
        return self.db.scalars(stmt).first()

    def get_by_license(self, license_number: str) -> Optional[Doctor]:
        stmt = select(Doctor).where(Doctor.license_number == license_number)
        return self.db.scalars(stmt).first()

    def get_by_department(self, department_id: int) -> List[Doctor]:
        stmt = select(Doctor).where(Doctor.department_id == department_id)
        return list(self.db.scalars(stmt).all())


class DoctorScheduleRepository(BaseRepository[DoctorSchedule, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(DoctorSchedule, db)

    def get_by_doctor(self, doctor_id: int) -> List[DoctorSchedule]:
        stmt = select(DoctorSchedule).where(DoctorSchedule.doctor_id == doctor_id)
        return list(self.db.scalars(stmt).all())
