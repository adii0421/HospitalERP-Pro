"""
Laboratory module Pydantic schemas.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import LabTestStatus


class LabTestBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    category: str = "general"
    sample_type: str = "blood"
    price: float = Field(0.0, ge=0)
    turnaround_hours: int = Field(24, ge=1)
    normal_range: Optional[str] = None


class LabTestCreate(LabTestBase):
    pass


class LabTestUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    sample_type: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    turnaround_hours: Optional[int] = Field(None, ge=1)
    normal_range: Optional[str] = None


class LabTestOut(LabTestBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class LabTestOrderBase(BaseModel):
    patient_id: int
    doctor_id: int
    lab_test_id: int
    status: LabTestStatus = LabTestStatus.ORDERED
    result: Optional[str] = None
    result_notes: Optional[str] = None


class LabTestOrderCreate(LabTestOrderBase):
    pass


class LabTestOrderUpdate(BaseModel):
    status: Optional[LabTestStatus] = None
    result: Optional[str] = None
    result_notes: Optional[str] = None
    sample_collected_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class LabTestOrderOut(LabTestOrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ordered_at: datetime
    sample_collected_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    test_name: Optional[str] = None
