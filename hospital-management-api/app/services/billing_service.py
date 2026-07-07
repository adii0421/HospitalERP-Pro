"""
Billing service - invoice generation, line-item totals and payment recording.
"""
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.billing import Invoice
from app.models.enums import InvoiceStatus
from app.repositories.billing_repository import (
    InvoiceItemRepository,
    InvoiceRepository,
    PaymentRepository,
)
from app.repositories.patient_repository import PatientRepository
from app.schemas.billing import InvoiceCreate, InvoiceOut, InvoiceUpdate, PaymentCreate


class BillingService:
    def __init__(self, db: Session):
        self.repo = InvoiceRepository(db)
        self.item_repo = InvoiceItemRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.patient_repo = PatientRepository(db)

    def _generate_invoice_number(self) -> str:
        seq = self.repo.get_latest_sequence() + 1
        return f"INV-{seq:06d}"

    def _to_out(self, invoice: Invoice) -> InvoiceOut:
        out = InvoiceOut.model_validate(invoice)
        out.balance_due = invoice.balance_due
        out.patient_name = invoice.patient.full_name if invoice.patient else None
        return out

    def list(self, skip: int = 0, limit: int = 100) -> List[InvoiceOut]:
        return [self._to_out(i) for i in self.repo.get_all(skip, limit)]

    def get(self, invoice_id: int) -> Invoice:
        invoice = self.repo.get(invoice_id)
        if not invoice:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
        return invoice

    def get_out(self, invoice_id: int) -> InvoiceOut:
        return self._to_out(self.get(invoice_id))

    def _recalculate_totals(self, invoice: Invoice) -> Invoice:
        subtotal = sum(item.total_price for item in invoice.items)
        invoice.subtotal = round(subtotal, 2)
        invoice.total_amount = round(subtotal + invoice.tax_amount - invoice.discount_amount, 2)
        if invoice.amount_paid >= invoice.total_amount and invoice.total_amount > 0:
            invoice.status = InvoiceStatus.PAID
        elif invoice.amount_paid > 0:
            invoice.status = InvoiceStatus.PARTIALLY_PAID
        self.repo.db.add(invoice)
        self.repo.db.commit()
        self.repo.db.refresh(invoice)
        return invoice

    def create(self, payload: InvoiceCreate) -> InvoiceOut:
        if not self.patient_repo.get(payload.patient_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid patient_id")
        data = payload.model_dump(exclude={"items"})
        data["invoice_number"] = self._generate_invoice_number()
        invoice = self.repo.create(data)
        for item in payload.items:
            item_data = item.model_dump()
            item_data["total_price"] = round(item.quantity * item.unit_price, 2)
            item_data["invoice_id"] = invoice.id
            self.item_repo.create(item_data)
        self.repo.db.refresh(invoice)
        invoice = self._recalculate_totals(invoice)
        return self._to_out(invoice)

    def update(self, invoice_id: int, payload: InvoiceUpdate) -> InvoiceOut:
        invoice = self.get(invoice_id)
        data = payload.model_dump(exclude_unset=True, exclude={"items"})
        invoice = self.repo.update(invoice, data)
        if payload.items is not None:
            for existing in list(invoice.items):
                self.item_repo.delete(existing)
            for item in payload.items:
                item_data = item.model_dump()
                item_data["total_price"] = round(item.quantity * item.unit_price, 2)
                item_data["invoice_id"] = invoice.id
                self.item_repo.create(item_data)
            self.repo.db.refresh(invoice)
        invoice = self._recalculate_totals(invoice)
        return self._to_out(invoice)

    def delete(self, invoice_id: int) -> None:
        invoice = self.get(invoice_id)
        self.repo.delete(invoice)

    def add_payment(self, invoice_id: int, payload: PaymentCreate) -> InvoiceOut:
        invoice = self.get(invoice_id)
        remaining = invoice.balance_due
        if payload.amount > remaining + 0.01:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment exceeds balance due ({remaining:.2f})",
            )
        data = payload.model_dump()
        data["invoice_id"] = invoice_id
        self.payment_repo.create(data)
        invoice.amount_paid = round(invoice.amount_paid + payload.amount, 2)
        invoice = self._recalculate_totals(invoice)
        return self._to_out(invoice)
