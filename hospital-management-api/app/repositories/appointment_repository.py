"""
Repository for Appointment entity.
"""
from datetime import datetime
from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.repositories.base import BaseRepository


class AppointmentRepository(BaseRepository[Appointment, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(Appointment, db)

    def get_by_doctor(self, doctor_id: int) -> List[Appointment]:
        stmt = select(Appointment).where(Appointment.doctor_id == doctor_id)
        return list(self.db.scalars(stmt).all())

    def get_by_patient(self, patient_id: int) -> List[Appointment]:
        stmt = select(Appointment).where(Appointment.patient_id == patient_id)
        return list(self.db.scalars(stmt).all())

    def get_between(self, start: datetime, end: datetime) -> List[Appointment]:
        stmt = select(Appointment).where(
            Appointment.scheduled_at >= start, Appointment.scheduled_at < end
        )
        return list(self.db.scalars(stmt).all())

    def get_all_ordered(self, skip: int = 0, limit: int = 100) -> List[Appointment]:
        stmt = (
            select(Appointment)
            .order_by(Appointment.scheduled_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())
