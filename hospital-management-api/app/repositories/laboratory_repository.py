"""
Repository for LabTest and LabTestOrder entities.
"""
from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import LabTestStatus
from app.models.laboratory import LabTest, LabTestOrder
from app.repositories.base import BaseRepository


class LabTestRepository(BaseRepository[LabTest, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(LabTest, db)


class LabTestOrderRepository(BaseRepository[LabTestOrder, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(LabTestOrder, db)

    def get_by_patient(self, patient_id: int) -> List[LabTestOrder]:
        stmt = select(LabTestOrder).where(LabTestOrder.patient_id == patient_id)
        return list(self.db.scalars(stmt).all())

    def get_pending(self) -> List[LabTestOrder]:
        stmt = select(LabTestOrder).where(
            LabTestOrder.status.in_(
                [LabTestStatus.ORDERED, LabTestStatus.SAMPLE_COLLECTED, LabTestStatus.IN_PROGRESS]
            )
        )
        return list(self.db.scalars(stmt).all())
