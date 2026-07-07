"""
Staff module Pydantic schemas.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import StaffStatus, EmploymentType


class StaffBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=20)
    designation: str = Field(..., min_length=2, max_length=150)
    department_id: Optional[int] = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    status: StaffStatus = StaffStatus.ACTIVE
    date_joined: date
    salary: float = Field(0.0, ge=0)
    address: Optional[str] = None


class StaffCreate(StaffBase):
    pass


class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[int] = None
    employment_type: Optional[EmploymentType] = None
    status: Optional[StaffStatus] = None
    date_joined: Optional[date] = None
    salary: Optional[float] = Field(None, ge=0)
    address: Optional[str] = None


class StaffOut(StaffBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    department_name: Optional[str] = None


class LeaveRequestBase(BaseModel):
    staff_id: int
    start_date: date
    end_date: date
    reason: Optional[str] = None
    status: str = "pending"


class LeaveRequestCreate(LeaveRequestBase):
    pass


class LeaveRequestUpdate(BaseModel):
    status: Optional[str] = None
    reason: Optional[str] = None


class LeaveRequestOut(LeaveRequestBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    requested_at: datetime
    staff_name: Optional[str] = None
