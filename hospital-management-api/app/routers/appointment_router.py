"""
Appointment module endpoints.
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.appointment import AppointmentCreate, AppointmentOut, AppointmentUpdate
from app.services.appointment_service import AppointmentService

router = APIRouter(prefix="/appointments", tags=["Appointments"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=List[AppointmentOut])
def list_appointments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return AppointmentService(db).list(skip, limit)


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    return AppointmentService(db).get_out(appointment_id)


@router.get("/doctor/{doctor_id}", response_model=List[AppointmentOut])
def get_by_doctor(doctor_id: int, db: Session = Depends(get_db)):
    return AppointmentService(db).by_doctor(doctor_id)


@router.post("/", response_model=AppointmentOut, status_code=201)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db)):
    return AppointmentService(db).create(payload)


@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(appointment_id: int, payload: AppointmentUpdate, db: Session = Depends(get_db)):
    return AppointmentService(db).update(appointment_id, payload)


@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    AppointmentService(db).delete(appointment_id)
