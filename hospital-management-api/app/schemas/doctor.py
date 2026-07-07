"""
Doctor and DoctorSchedule Pydantic schemas.
"""
from datetime import datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DoctorScheduleBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday ... 6=Sunday")
    start_time: time
    end_time: time
    slot_duration_minutes: int = Field(30, ge=5, le=240)


class DoctorScheduleCreate(DoctorScheduleBase):
    pass


class DoctorScheduleOut(DoctorScheduleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    doctor_id: int


class DoctorBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=20)
    specialization: str = Field(..., min_length=2, max_length=150)
    qualification: Optional[str] = None
    license_number: str = Field(..., min_length=2, max_length=100)
    years_of_experience: int = Field(0, ge=0, le=70)
    consultation_fee: float = Field(0.0, ge=0)
    department_id: Optional[int] = None
    is_available: bool = True


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    license_number: Optional[str] = None
    years_of_experience: Optional[int] = Field(None, ge=0, le=70)
    consultation_fee: Optional[float] = Field(None, ge=0)
    department_id: Optional[int] = None
    is_available: Optional[bool] = None


class DoctorOut(DoctorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    joined_at: datetime
    department_name: Optional[str] = None
