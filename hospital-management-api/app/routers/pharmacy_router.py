"""
Pharmacy module endpoints - medicine catalog and prescriptions.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.pharmacy import (
    MedicineCreate,
    MedicineOut,
    MedicineUpdate,
    PrescriptionCreate,
    PrescriptionOut,
    PrescriptionUpdate,
)
from app.services.pharmacy_service import MedicineService, PrescriptionService

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy"], dependencies=[Depends(get_current_user)])


@router.get("/medicines", response_model=List[MedicineOut])
def list_medicines(
    skip: int = 0, limit: int = 100, search: Optional[str] = None, db: Session = Depends(get_db)
):
    return MedicineService(db).list(skip, limit, search)


@router.get("/medicines/low-stock", response_model=List[MedicineOut])
def low_stock_medicines(db: Session = Depends(get_db)):
    return MedicineService(db).low_stock()


@router.get("/medicines/{medicine_id}", response_model=MedicineOut)
def get_medicine(medicine_id: int, db: Session = Depends(get_db)):
    return MedicineService(db).get_out(medicine_id)


@router.post("/medicines", response_model=MedicineOut, status_code=201)
def create_medicine(payload: MedicineCreate, db: Session = Depends(get_db)):
    return MedicineService(db).create(payload)


@router.put("/medicines/{medicine_id}", response_model=MedicineOut)
def update_medicine(medicine_id: int, payload: MedicineUpdate, db: Session = Depends(get_db)):
    return MedicineService(db).update(medicine_id, payload)


@router.delete("/medicines/{medicine_id}", status_code=204)
def delete_medicine(medicine_id: int, db: Session = Depends(get_db)):
    MedicineService(db).delete(medicine_id)


@router.get("/prescriptions", response_model=List[PrescriptionOut])
def list_prescriptions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return PrescriptionService(db).list(skip, limit)


@router.get("/prescriptions/{prescription_id}", response_model=PrescriptionOut)
def get_prescription(prescription_id: int, db: Session = Depends(get_db)):
    return PrescriptionService(db).get_out(prescription_id)


@router.post("/prescriptions", response_model=PrescriptionOut, status_code=201)
def create_prescription(payload: PrescriptionCreate, db: Session = Depends(get_db)):
    return PrescriptionService(db).create(payload)


@router.put("/prescriptions/{prescription_id}", response_model=PrescriptionOut)
def update_prescription(prescription_id: int, payload: PrescriptionUpdate, db: Session = Depends(get_db)):
    return PrescriptionService(db).update(prescription_id, payload)


@router.post("/prescriptions/{prescription_id}/dispense", response_model=PrescriptionOut)
def dispense_prescription(prescription_id: int, db: Session = Depends(get_db)):
    return PrescriptionService(db).dispense(prescription_id)


@router.delete("/prescriptions/{prescription_id}", status_code=204)
def delete_prescription(prescription_id: int, db: Session = Depends(get_db)):
    PrescriptionService(db).delete(prescription_id)
