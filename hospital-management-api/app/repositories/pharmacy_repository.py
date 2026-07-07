"""
Repository for Medicine, Prescription and PrescriptionItem entities.
"""
from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.pharmacy import Medicine, Prescription, PrescriptionItem
from app.repositories.base import BaseRepository


class MedicineRepository(BaseRepository[Medicine, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(Medicine, db)

    def get_low_stock(self) -> List[Medicine]:
        stmt = select(Medicine).where(Medicine.stock_quantity <= Medicine.reorder_level)
        return list(self.db.scalars(stmt).all())

    def search(self, query: str) -> List[Medicine]:
        pattern = f"%{query}%"
        stmt = select(Medicine).where(Medicine.name.ilike(pattern))
        return list(self.db.scalars(stmt).all())


class PrescriptionRepository(BaseRepository[Prescription, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(Prescription, db)

    def get_by_patient(self, patient_id: int) -> List[Prescription]:
        stmt = select(Prescription).where(Prescription.patient_id == patient_id)
        return list(self.db.scalars(stmt).all())


class PrescriptionItemRepository(BaseRepository[PrescriptionItem, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(PrescriptionItem, db)

    def get_by_prescription(self, prescription_id: int) -> List[PrescriptionItem]:
        stmt = select(PrescriptionItem).where(PrescriptionItem.prescription_id == prescription_id)
        return list(self.db.scalars(stmt).all())
