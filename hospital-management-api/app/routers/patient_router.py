"""
Patient module endpoints, including search and per-patient appointment history.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.appointment import AppointmentOut
from app.schemas.patient import PatientCreate, PatientOut, PatientUpdate
from app.services.appointment_service import AppointmentService
from app.services.patient_service import PatientService

router = APIRouter(prefix="/patients", tags=["Patients"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=List[PatientOut])
def list_patients(
    skip: int = 0, limit: int = 100, search: Optional[str] = None, db: Session = Depends(get_db)
):
    return PatientService(db).list(skip, limit, search)


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    return PatientService(db).get_out(patient_id)


@router.get("/{patient_id}/appointments", response_model=List[AppointmentOut])
def get_patient_appointments(patient_id: int, db: Session = Depends(get_db)):
    return AppointmentService(db).by_patient(patient_id)


@router.post("/", response_model=PatientOut, status_code=201)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    return PatientService(db).create(payload)


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(patient_id: int, payload: PatientUpdate, db: Session = Depends(get_db)):
    return PatientService(db).update(patient_id, payload)


@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    PatientService(db).delete(patient_id)
