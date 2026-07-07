"""
Billing module endpoints - invoices, line items and payments.
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.billing import InvoiceCreate, InvoiceOut, InvoiceUpdate, PaymentCreate
from app.services.billing_service import BillingService

router = APIRouter(prefix="/billing", tags=["Billing"], dependencies=[Depends(get_current_user)])


@router.get("/invoices", response_model=List[InvoiceOut])
def list_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return BillingService(db).list(skip, limit)


@router.get("/invoices/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    return BillingService(db).get_out(invoice_id)


@router.post("/invoices", response_model=InvoiceOut, status_code=201)
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db)):
    return BillingService(db).create(payload)


@router.put("/invoices/{invoice_id}", response_model=InvoiceOut)
def update_invoice(invoice_id: int, payload: InvoiceUpdate, db: Session = Depends(get_db)):
    return BillingService(db).update(invoice_id, payload)


@router.delete("/invoices/{invoice_id}", status_code=204)
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    BillingService(db).delete(invoice_id)


@router.post("/invoices/{invoice_id}/payments", response_model=InvoiceOut, status_code=201)
def add_payment(invoice_id: int, payload: PaymentCreate, db: Session = Depends(get_db)):
    return BillingService(db).add_payment(invoice_id, payload)
