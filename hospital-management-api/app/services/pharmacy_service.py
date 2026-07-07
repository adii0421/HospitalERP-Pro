"""
Pharmacy service - medicine catalog management and prescription dispensing.
"""
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import PrescriptionStatus
from app.models.pharmacy import Medicine, Prescription
from app.repositories.doctor_repository import DoctorRepository
from app.repositories.patient_repository import PatientRepository
from app.repositories.pharmacy_repository import (
    MedicineRepository,
    PrescriptionItemRepository,
    PrescriptionRepository,
)
from app.schemas.pharmacy import (
    MedicineCreate,
    MedicineOut,
    MedicineUpdate,
    PrescriptionCreate,
    PrescriptionOut,
    PrescriptionUpdate,
)


class MedicineService:
    def __init__(self, db: Session):
        self.repo = MedicineRepository(db)

    def list(self, skip: int = 0, limit: int = 100, search: str | None = None) -> List[MedicineOut]:
        meds = self.repo.search(search) if search else self.repo.get_all(skip, limit)
        return [MedicineOut.model_validate(m) for m in meds]

    def get(self, medicine_id: int) -> Medicine:
        med = self.repo.get(medicine_id)
        if not med:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found")
        return med

    def get_out(self, medicine_id: int) -> MedicineOut:
        return MedicineOut.model_validate(self.get(medicine_id))

    def create(self, payload: MedicineCreate) -> MedicineOut:
        med = self.repo.create(payload.model_dump())
        return MedicineOut.model_validate(med)

    def update(self, medicine_id: int, payload: MedicineUpdate) -> MedicineOut:
        med = self.get(medicine_id)
        med = self.repo.update(med, payload.model_dump(exclude_unset=True))
        return MedicineOut.model_validate(med)

    def delete(self, medicine_id: int) -> None:
        med = self.get(medicine_id)
        self.repo.delete(med)

    def low_stock(self) -> List[MedicineOut]:
        return [MedicineOut.model_validate(m) for m in self.repo.get_low_stock()]


class PrescriptionService:
    def __init__(self, db: Session):
        self.repo = PrescriptionRepository(db)
        self.item_repo = PrescriptionItemRepository(db)
        self.medicine_repo = MedicineRepository(db)
        self.patient_repo = PatientRepository(db)
        self.doctor_repo = DoctorRepository(db)

    def _to_out(self, presc: Prescription) -> PrescriptionOut:
        out = PrescriptionOut.model_validate(presc)
        out.patient_name = presc.patient.full_name if presc.patient else None
        out.doctor_name = presc.doctor.full_name if presc.doctor else None
        for i, item in enumerate(presc.items):
            out.items[i].medicine_name = item.medicine.name if item.medicine else None
        return out

    def list(self, skip: int = 0, limit: int = 100) -> List[PrescriptionOut]:
        return [self._to_out(p) for p in self.repo.get_all(skip, limit)]

    def get(self, prescription_id: int) -> Prescription:
        presc = self.repo.get(prescription_id)
        if not presc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
        return presc

    def get_out(self, prescription_id: int) -> PrescriptionOut:
        return self._to_out(self.get(prescription_id))

    def create(self, payload: PrescriptionCreate) -> PrescriptionOut:
        if not self.patient_repo.get(payload.patient_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid patient_id")
        if not self.doctor_repo.get(payload.doctor_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid doctor_id")
        data = payload.model_dump(exclude={"items"})
        presc = self.repo.create(data)
        for item in payload.items:
            if not self.medicine_repo.get(item.medicine_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid medicine_id {item.medicine_id}",
                )
            item_data = item.model_dump()
            item_data["prescription_id"] = presc.id
            self.item_repo.create(item_data)
        self.repo.db.refresh(presc)
        return self._to_out(presc)

    def update(self, prescription_id: int, payload: PrescriptionUpdate) -> PrescriptionOut:
        presc = self.get(prescription_id)
        presc = self.repo.update(presc, payload.model_dump(exclude_unset=True))
        return self._to_out(presc)

    def delete(self, prescription_id: int) -> None:
        presc = self.get(prescription_id)
        self.repo.delete(presc)

    def dispense(self, prescription_id: int) -> PrescriptionOut:
        presc = self.get(prescription_id)
        all_dispensed = True
        for item in presc.items:
            medicine = item.medicine
            if item.dispensed:
                continue
            if medicine.stock_quantity < item.quantity:
                all_dispensed = False
                continue
            medicine.stock_quantity -= item.quantity
            item.dispensed = True
            self.repo.db.add(medicine)
            self.repo.db.add(item)
        presc.status = (
            PrescriptionStatus.DISPENSED if all_dispensed else PrescriptionStatus.PARTIALLY_DISPENSED
        )
        self.repo.db.add(presc)
        self.repo.db.commit()
        self.repo.db.refresh(presc)
        return self._to_out(presc)
