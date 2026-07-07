"""
Department model - represents hospital departments (Cardiology, Neurology, etc.)
"""
from datetime import datetime, timezone
from typing import List, TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.doctor import Doctor


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(150), nullable=True)
    head_doctor_id: Mapped[int] = mapped_column(Integer, nullable=True)
    phone_extension: Mapped[str] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    doctors: Mapped[List["Doctor"]] = relationship(back_populates="department")
