"""
Appointment scheduling service.
"""
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.doctor_repository import DoctorRepository
from app.repositories.patient_repository import PatientRepository
from app.schemas.appointment import AppointmentCreate, AppointmentOut, AppointmentUpdate


class AppointmentService:
    def __init__(self, db: Session):
        self.repo = AppointmentRepository(db)
        self.doctor_repo = DoctorRepository(db)
        self.patient_repo = PatientRepository(db)

    def _to_out(self, appt: Appointment) -> AppointmentOut:
        out = AppointmentOut.model_validate(appt)
        out.patient_name = appt.patient.full_name if appt.patient else None
        out.doctor_name = appt.doctor.full_name if appt.doctor else None
        return out

    def list(self, skip: int = 0, limit: int = 100) -> List[AppointmentOut]:
        return [self._to_out(a) for a in self.repo.get_all_ordered(skip, limit)]

    def get(self, appt_id: int) -> Appointment:
        appt = self.repo.get(appt_id)
        if not appt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
        return appt

    def get_out(self, appt_id: int) -> AppointmentOut:
        return self._to_out(self.get(appt_id))

    def _validate_refs(self, patient_id: int, doctor_id: int) -> None:
        if not self.patient_repo.get(patient_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid patient_id")
        if not self.doctor_repo.get(doctor_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid doctor_id")

    def create(self, payload: AppointmentCreate) -> AppointmentOut:
        self._validate_refs(payload.patient_id, payload.doctor_id)
        appt = self.repo.create(payload.model_dump())
        return self._to_out(appt)

    def update(self, appt_id: int, payload: AppointmentUpdate) -> AppointmentOut:
        appt = self.get(appt_id)
        data = payload.model_dump(exclude_unset=True)
        if "patient_id" in data or "doctor_id" in data:
            self._validate_refs(
                data.get("patient_id", appt.patient_id), data.get("doctor_id", appt.doctor_id)
            )
        appt = self.repo.update(appt, data)
        return self._to_out(appt)

    def delete(self, appt_id: int) -> None:
        appt = self.get(appt_id)
        self.repo.delete(appt)

    def by_doctor(self, doctor_id: int) -> List[AppointmentOut]:
        return [self._to_out(a) for a in self.repo.get_by_doctor(doctor_id)]

    def by_patient(self, patient_id: int) -> List[AppointmentOut]:
        return [self._to_out(a) for a in self.repo.get_by_patient(patient_id)]
