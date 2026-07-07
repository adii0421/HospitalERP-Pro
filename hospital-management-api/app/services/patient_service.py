"""
Patient management service. Auto-generates human-friendly patient codes.
"""
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.repositories.patient_repository import PatientRepository
from app.schemas.patient import PatientCreate, PatientOut, PatientUpdate


class PatientService:
    def __init__(self, db: Session):
        self.repo = PatientRepository(db)

    def _generate_patient_code(self) -> str:
        seq = self.repo.get_latest_code_sequence() + 1
        return f"PT-{seq:05d}"

    def list(self, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> List[PatientOut]:
        patients = self.repo.search(search, skip, limit) if search else self.repo.get_all(skip, limit)
        return [PatientOut.model_validate(p) for p in patients]

    def get(self, patient_id: int) -> Patient:
        patient = self.repo.get(patient_id)
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        return patient

    def get_out(self, patient_id: int) -> PatientOut:
        return PatientOut.model_validate(self.get(patient_id))

    def create(self, payload: PatientCreate) -> PatientOut:
        data = payload.model_dump()
        data["patient_code"] = self._generate_patient_code()
        patient = self.repo.create(data)
        return PatientOut.model_validate(patient)

    def update(self, patient_id: int, payload: PatientUpdate) -> PatientOut:
        patient = self.get(patient_id)
        patient = self.repo.update(patient, payload.model_dump(exclude_unset=True))
        return PatientOut.model_validate(patient)

    def delete(self, patient_id: int) -> None:
        patient = self.get(patient_id)
        self.repo.delete(patient)
