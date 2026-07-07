"""
Department Pydantic schemas.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=150)
    head_doctor_id: Optional[int] = None
    phone_extension: Optional[str] = Field(None, max_length=20)
    is_active: bool = True


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    location: Optional[str] = None
    head_doctor_id: Optional[int] = None
    phone_extension: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentOut(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    doctor_count: Optional[int] = 0
