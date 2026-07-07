"""
Doctor module endpoints, including per-doctor weekly schedule management.
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.doctor import (
    DoctorCreate,
    DoctorOut,
    DoctorScheduleCreate,
    DoctorScheduleOut,
    DoctorUpdate,
)
from app.services.doctor_service import DoctorService

router = APIRouter(prefix="/doctors", tags=["Doctors"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=List[DoctorOut])
def list_doctors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return DoctorService(db).list(skip, limit)


@router.get("/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    return DoctorService(db).get_out(doctor_id)


@router.post("/", response_model=DoctorOut, status_code=201)
def create_doctor(payload: DoctorCreate, db: Session = Depends(get_db)):
    return DoctorService(db).create(payload)


@router.put("/{doctor_id}", response_model=DoctorOut)
def update_doctor(doctor_id: int, payload: DoctorUpdate, db: Session = Depends(get_db)):
    return DoctorService(db).update(doctor_id, payload)


@router.delete("/{doctor_id}", status_code=204)
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    DoctorService(db).delete(doctor_id)


@router.get("/{doctor_id}/schedules", response_model=List[DoctorScheduleOut])
def list_schedules(doctor_id: int, db: Session = Depends(get_db)):
    return DoctorService(db).list_schedules(doctor_id)


@router.post("/{doctor_id}/schedules", response_model=DoctorScheduleOut, status_code=201)
def add_schedule(doctor_id: int, payload: DoctorScheduleCreate, db: Session = Depends(get_db)):
    return DoctorService(db).add_schedule(doctor_id, payload)


@router.delete("/{doctor_id}/schedules/{schedule_id}", status_code=204)
def delete_schedule(doctor_id: int, schedule_id: int, db: Session = Depends(get_db)):
    DoctorService(db).delete_schedule(doctor_id, schedule_id)
