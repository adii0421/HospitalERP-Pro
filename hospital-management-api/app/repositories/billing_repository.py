"""
Repository for Invoice, InvoiceItem and Payment entities.
"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.billing import Invoice, InvoiceItem, Payment
from app.repositories.base import BaseRepository


class InvoiceRepository(BaseRepository[Invoice, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(Invoice, db)

    def get_by_number(self, invoice_number: str) -> Optional[Invoice]:
        stmt = select(Invoice).where(Invoice.invoice_number == invoice_number)
        return self.db.scalars(stmt).first()

    def get_by_patient(self, patient_id: int) -> List[Invoice]:
        stmt = select(Invoice).where(Invoice.patient_id == patient_id)
        return list(self.db.scalars(stmt).all())

    def get_between(self, start: datetime, end: datetime) -> List[Invoice]:
        stmt = select(Invoice).where(Invoice.issue_date >= start, Invoice.issue_date < end)
        return list(self.db.scalars(stmt).all())

    def get_latest_sequence(self) -> int:
        stmt = select(Invoice).order_by(Invoice.id.desc()).limit(1)
        latest = self.db.scalars(stmt).first()
        return latest.id if latest else 0


class InvoiceItemRepository(BaseRepository[InvoiceItem, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(InvoiceItem, db)

    def get_by_invoice(self, invoice_id: int) -> List[InvoiceItem]:
        stmt = select(InvoiceItem).where(InvoiceItem.invoice_id == invoice_id)
        return list(self.db.scalars(stmt).all())


class PaymentRepository(BaseRepository[Payment, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(Payment, db)

    def get_by_invoice(self, invoice_id: int) -> List[Payment]:
        stmt = select(Payment).where(Payment.invoice_id == invoice_id)
        return list(self.db.scalars(stmt).all())
