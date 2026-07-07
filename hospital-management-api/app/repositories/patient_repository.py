"""
Repository for Patient entity.
"""
from typing import List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.repositories.base import BaseRepository


class PatientRepository(BaseRepository[Patient, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(Patient, db)

    def get_by_code(self, patient_code: str) -> Optional[Patient]:
        stmt = select(Patient).where(Patient.patient_code == patient_code)
        return self.db.scalars(stmt).first()

    def search(self, query: str, skip: int = 0, limit: int = 100) -> List[Patient]:
        pattern = f"%{query}%"
        stmt = (
            select(Patient)
            .where(
                or_(
                    Patient.full_name.ilike(pattern),
                    Patient.phone.ilike(pattern),
                    Patient.patient_code.ilike(pattern),
                )
            )
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def get_latest_code_sequence(self) -> int:
        stmt = select(Patient).order_by(Patient.id.desc()).limit(1)
        latest = self.db.scalars(stmt).first()
        return latest.id if latest else 0
