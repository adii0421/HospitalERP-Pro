"""
Staff module endpoints - employee records and leave requests.
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.staff import (
    LeaveRequestCreate,
    LeaveRequestOut,
    LeaveRequestUpdate,
    StaffCreate,
    StaffOut,
    StaffUpdate,
)
from app.services.staff_service import LeaveRequestService, StaffService

router = APIRouter(prefix="/staff", tags=["Staff"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=List[StaffOut])
def list_staff(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return StaffService(db).list(skip, limit)


@router.get("/{staff_id}", response_model=StaffOut)
def get_staff(staff_id: int, db: Session = Depends(get_db)):
    return StaffService(db).get_out(staff_id)


@router.post("/", response_model=StaffOut, status_code=201)
def create_staff(payload: StaffCreate, db: Session = Depends(get_db)):
    return StaffService(db).create(payload)


@router.put("/{staff_id}", response_model=StaffOut)
def update_staff(staff_id: int, payload: StaffUpdate, db: Session = Depends(get_db)):
    return StaffService(db).update(staff_id, payload)


@router.delete("/{staff_id}", status_code=204)
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    StaffService(db).delete(staff_id)


@router.get("/leave/all", response_model=List[LeaveRequestOut])
def list_leave_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return LeaveRequestService(db).list(skip, limit)


@router.post("/leave", response_model=LeaveRequestOut, status_code=201)
def create_leave_request(payload: LeaveRequestCreate, db: Session = Depends(get_db)):
    return LeaveRequestService(db).create(payload)


@router.put("/leave/{leave_id}", response_model=LeaveRequestOut)
def update_leave_request(leave_id: int, payload: LeaveRequestUpdate, db: Session = Depends(get_db)):
    return LeaveRequestService(db).update(leave_id, payload)


@router.delete("/leave/{leave_id}", status_code=204)
def delete_leave_request(leave_id: int, db: Session = Depends(get_db)):
    LeaveRequestService(db).delete(leave_id)
