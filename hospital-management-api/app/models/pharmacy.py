"""
Pharmacy module models - Medicine inventory, Prescriptions and their line items.
"""
from datetime import date, datetime, timezone
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import PrescriptionStatus

if TYPE_CHECKING:
    from app.models.patient import Patient
    from app.models.doctor import Doctor


class Medicine(Base):
    __tablename__ = "medicines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    generic_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    category: Mapped[str] = mapped_column(String(100), default="general")
    manufacturer: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    unit: Mapped[str] = mapped_column(String(30), default="tablet")
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    reorder_level: Mapped[int] = mapped_column(Integer, default=10)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    batch_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    requires_prescription: Mapped[bool] = mapped_column(default=True)

    prescription_items: Mapped[List["PrescriptionItem"]] = relationship(back_populates="medicine")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    prescribed_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    diagnosis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[PrescriptionStatus] = mapped_column(
        Enum(PrescriptionStatus), default=PrescriptionStatus.PENDING
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    patient: Mapped["Patient"] = relationship()
    doctor: Mapped["Doctor"] = relationship()
    items: Mapped[List["PrescriptionItem"]] = relationship(
        back_populates="prescription", cascade="all, delete-orphan"
    )


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    prescription_id: Mapped[int] = mapped_column(ForeignKey("prescriptions.id"), nullable=False)
    medicine_id: Mapped[int] = mapped_column(ForeignKey("medicines.id"), nullable=False)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    frequency: Mapped[str] = mapped_column(String(100), nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, default=7)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dispensed: Mapped[bool] = mapped_column(default=False)

    prescription: Mapped["Prescription"] = relationship(back_populates="items")
    medicine: Mapped["Medicine"] = relationship(back_populates="prescription_items")
