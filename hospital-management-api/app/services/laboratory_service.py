"""
Laboratory service - test catalog and patient test order workflow.
"""
from datetime import datetime, timezone
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import LabTestStatus
from app.models.laboratory import LabTestOrder
from app.repositories.doctor_repository import DoctorRepository
from app.repositories.laboratory_repository import LabTestOrderRepository, LabTestRepository
from app.repositories.patient_repository import PatientRepository
from app.schemas.laboratory import (
    LabTestCreate,
    LabTestOrderCreate,
    LabTestOrderOut,
    LabTestOrderUpdate,
    LabTestOut,
    LabTestUpdate,
)


class LabTestService:
    def __init__(self, db: Session):
        self.repo = LabTestRepository(db)

    def list(self, skip: int = 0, limit: int = 100) -> List[LabTestOut]:
        return [LabTestOut.model_validate(t) for t in self.repo.get_all(skip, limit)]

    def get(self, test_id: int):
        test = self.repo.get(test_id)
        if not test:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab test not found")
        return test

    def get_out(self, test_id: int) -> LabTestOut:
        return LabTestOut.model_validate(self.get(test_id))

    def create(self, payload: LabTestCreate) -> LabTestOut:
        test = self.repo.create(payload.model_dump())
        return LabTestOut.model_validate(test)

    def update(self, test_id: int, payload: LabTestUpdate) -> LabTestOut:
        test = self.get(test_id)
        test = self.repo.update(test, payload.model_dump(exclude_unset=True))
        return LabTestOut.model_validate(test)

    def delete(self, test_id: int) -> None:
        test = self.get(test_id)
        self.repo.delete(test)


class LabTestOrderService:
    def __init__(self, db: Session):
        self.repo = LabTestOrderRepository(db)
        self.test_repo = LabTestRepository(db)
        self.patient_repo = PatientRepository(db)
        self.doctor_repo = DoctorRepository(db)

    def _to_out(self, order: LabTestOrder) -> LabTestOrderOut:
        out = LabTestOrderOut.model_validate(order)
        out.patient_name = order.patient.full_name if order.patient else None
        out.doctor_name = order.doctor.full_name if order.doctor else None
        out.test_name = order.lab_test.name if order.lab_test else None
        return out

    def list(self, skip: int = 0, limit: int = 100) -> List[LabTestOrderOut]:
        return [self._to_out(o) for o in self.repo.get_all(skip, limit)]

    def get(self, order_id: int) -> LabTestOrder:
        order = self.repo.get(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab test order not found")
        return order

    def get_out(self, order_id: int) -> LabTestOrderOut:
        return self._to_out(self.get(order_id))

    def create(self, payload: LabTestOrderCreate) -> LabTestOrderOut:
        if not self.patient_repo.get(payload.patient_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid patient_id")
        if not self.doctor_repo.get(payload.doctor_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid doctor_id")
        if not self.test_repo.get(payload.lab_test_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid lab_test_id")
        order = self.repo.create(payload.model_dump())
        return self._to_out(order)

    def update(self, order_id: int, payload: LabTestOrderUpdate) -> LabTestOrderOut:
        order = self.get(order_id)
        data = payload.model_dump(exclude_unset=True)
        if data.get("status") == LabTestStatus.SAMPLE_COLLECTED and not order.sample_collected_at:
            data["sample_collected_at"] = datetime.now(timezone.utc)
        if data.get("status") == LabTestStatus.COMPLETED and not order.completed_at:
            data["completed_at"] = datetime.now(timezone.utc)
        order = self.repo.update(order, data)
        return self._to_out(order)

    def delete(self, order_id: int) -> None:
        order = self.get(order_id)
        self.repo.delete(order)

    def pending(self) -> List[LabTestOrderOut]:
        return [self._to_out(o) for o in self.repo.get_pending()]
