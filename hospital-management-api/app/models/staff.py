"""
Staff module models - non-doctor hospital employees (nurses, admin, support)
and their leave requests.
"""
from datetime import date, datetime, timezone
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import StaffStatus, EmploymentType


class Staff(Base):
    __tablename__ = "staff"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    designation: Mapped[str] = mapped_column(String(150), nullable=False)
    department_id: Mapped[Optional[int]] = mapped_column(ForeignKey("departments.id"), nullable=True)
    employment_type: Mapped[EmploymentType] = mapped_column(Enum(EmploymentType), default=EmploymentType.FULL_TIME)
    status: Mapped[StaffStatus] = mapped_column(Enum(StaffStatus), default=StaffStatus.ACTIVE)
    date_joined: Mapped[date] = mapped_column(Date, nullable=False)
    salary: Mapped[float] = mapped_column(Float, default=0.0)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    department: Mapped[Optional["Department"]] = relationship()
    leave_requests: Mapped[List["LeaveRequest"]] = relationship(
        back_populates="staff", cascade="all, delete-orphan"
    )


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    staff_id: Mapped[int] = mapped_column(ForeignKey("staff.id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="pending")
    requested_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    staff: Mapped["Staff"] = relationship(back_populates="leave_requests")


from app.models.department import Department  # noqa: E402  (avoid circular import at module load)
