"""
Doctor and schedule management service.
"""
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.doctor import Doctor
from app.repositories.department_repository import DepartmentRepository
from app.repositories.doctor_repository import DoctorRepository, DoctorScheduleRepository
from app.schemas.doctor import (
    DoctorCreate,
    DoctorOut,
    DoctorScheduleCreate,
    DoctorScheduleOut,
    DoctorUpdate,
)


class DoctorService:
    def __init__(self, db: Session):
        self.repo = DoctorRepository(db)
        self.dept_repo = DepartmentRepository(db)
        self.schedule_repo = DoctorScheduleRepository(db)

    def _to_out(self, doctor: Doctor) -> DoctorOut:
        out = DoctorOut.model_validate(doctor)
        out.department_name = doctor.department.name if doctor.department else None
        return out

    def list(self, skip: int = 0, limit: int = 100) -> List[DoctorOut]:
        return [self._to_out(d) for d in self.repo.get_all(skip, limit)]

    def get(self, doctor_id: int) -> Doctor:
        doctor = self.repo.get(doctor_id)
        if not doctor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
        return doctor

    def get_out(self, doctor_id: int) -> DoctorOut:
        return self._to_out(self.get(doctor_id))

    def create(self, payload: DoctorCreate) -> DoctorOut:
        if self.repo.get_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        if self.repo.get_by_license(payload.license_number):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="License number already registered")
        if payload.department_id and not self.dept_repo.get(payload.department_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid department_id")
        doctor = self.repo.create(payload.model_dump())
        return self._to_out(doctor)

    def update(self, doctor_id: int, payload: DoctorUpdate) -> DoctorOut:
        doctor = self.get(doctor_id)
        data = payload.model_dump(exclude_unset=True)
        if "department_id" in data and data["department_id"] and not self.dept_repo.get(data["department_id"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid department_id")
        doctor = self.repo.update(doctor, data)
        return self._to_out(doctor)

    def delete(self, doctor_id: int) -> None:
        doctor = self.get(doctor_id)
        self.repo.delete(doctor)

    def list_schedules(self, doctor_id: int) -> List[DoctorScheduleOut]:
        self.get(doctor_id)
        return [DoctorScheduleOut.model_validate(s) for s in self.schedule_repo.get_by_doctor(doctor_id)]

    def add_schedule(self, doctor_id: int, payload: DoctorScheduleCreate) -> DoctorScheduleOut:
        self.get(doctor_id)
        data = payload.model_dump()
        data["doctor_id"] = doctor_id
        schedule = self.schedule_repo.create(data)
        return DoctorScheduleOut.model_validate(schedule)

    def delete_schedule(self, doctor_id: int, schedule_id: int) -> None:
        self.get(doctor_id)
        schedule = self.schedule_repo.get(schedule_id)
        if not schedule or schedule.doctor_id != doctor_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
        self.schedule_repo.delete(schedule)
