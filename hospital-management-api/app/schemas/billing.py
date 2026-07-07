"""
Billing module Pydantic schemas.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import InvoiceStatus, PaymentMethod


class InvoiceItemBase(BaseModel):
    description: str = Field(..., min_length=1, max_length=255)
    category: str = "consultation"
    quantity: int = Field(1, ge=1)
    unit_price: float = Field(..., ge=0)


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemOut(InvoiceItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    total_price: float


class PaymentBase(BaseModel):
    amount: float = Field(..., gt=0)
    method: PaymentMethod = PaymentMethod.CASH
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentOut(PaymentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    invoice_id: int
    paid_at: datetime


class InvoiceBase(BaseModel):
    patient_id: int
    due_date: Optional[datetime] = None
    tax_amount: float = Field(0.0, ge=0)
    discount_amount: float = Field(0.0, ge=0)
    notes: Optional[str] = None
    status: InvoiceStatus = InvoiceStatus.DRAFT


class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate] = Field(default_factory=list)


class InvoiceUpdate(BaseModel):
    due_date: Optional[datetime] = None
    tax_amount: Optional[float] = Field(None, ge=0)
    discount_amount: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    status: Optional[InvoiceStatus] = None
    items: Optional[List[InvoiceItemCreate]] = None


class InvoiceOut(InvoiceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_number: str
    issue_date: datetime
    subtotal: float
    total_amount: float
    amount_paid: float
    balance_due: float
    patient_name: Optional[str] = None
    items: List[InvoiceItemOut] = Field(default_factory=list)
    payments: List[PaymentOut] = Field(default_factory=list)
