"""
Pharmacy module Pydantic schemas.
"""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PrescriptionStatus


class MedicineBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    generic_name: Optional[str] = None
    category: str = "general"
    manufacturer: Optional[str] = None
    unit: str = "tablet"
    unit_price: float = Field(0.0, ge=0)
    stock_quantity: int = Field(0, ge=0)
    reorder_level: int = Field(10, ge=0)
    expiry_date: Optional[date] = None
    batch_number: Optional[str] = None
    requires_prescription: bool = True


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)
    expiry_date: Optional[date] = None
    batch_number: Optional[str] = None
    requires_prescription: Optional[bool] = None


class MedicineOut(MedicineBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class PrescriptionItemBase(BaseModel):
    medicine_id: int
    dosage: str = Field(..., min_length=1, max_length=100)
    frequency: str = Field(..., min_length=1, max_length=100)
    duration_days: int = Field(7, ge=1)
    quantity: int = Field(1, ge=1)
    instructions: Optional[str] = None


class PrescriptionItemCreate(PrescriptionItemBase):
    pass


class PrescriptionItemOut(PrescriptionItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    dispensed: bool
    medicine_name: Optional[str] = None


class PrescriptionBase(BaseModel):
    patient_id: int
    doctor_id: int
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    status: PrescriptionStatus = PrescriptionStatus.PENDING


class PrescriptionCreate(PrescriptionBase):
    items: List[PrescriptionItemCreate] = Field(default_factory=list)


class PrescriptionUpdate(BaseModel):
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[PrescriptionStatus] = None


class PrescriptionOut(PrescriptionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prescribed_at: datetime
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    items: List[PrescriptionItemOut] = Field(default_factory=list)
