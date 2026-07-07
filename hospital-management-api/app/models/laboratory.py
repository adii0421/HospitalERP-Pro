"""
Laboratory module models - LabTest (catalog of available tests) and
LabTestOrder (a test ordered for a specific patient).
"""
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import LabTestStatus

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.doctor import Doctor


class LabTest(Base):
    """Catalog of lab tests the hospital offers."""
    __tablename__ = "lab_tests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="general")
    sample_type: Mapped[str] = mapped_column(String(100), default="blood")
    price: Mapped[float] = mapped_column(Float, default=0.0)
    turnaround_hours: Mapped[int] = mapped_column(Integer, default=24)
    normal_range: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class LabTestOrder(Base):
    """An order of a specific lab test for a patient."""
    __tablename__ = "lab_test_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    lab_test_id: Mapped[int] = mapped_column(ForeignKey("lab_tests.id"), nullable=False)
    ordered_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    sample_collected_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[LabTestStatus] = mapped_column(Enum(LabTestStatus), default=LabTestStatus.ORDERED)
    result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    result_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    patient: Mapped["Patient"] = relationship()
    doctor: Mapped["Doctor"] = relationship()
    lab_test: Mapped["LabTest"] = relationship()
