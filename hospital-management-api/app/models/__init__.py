"""
Import all models here so that Base.metadata is aware of every table
when create_all() is called from main.py / init_db.
"""
from app.models.user import User
from app.models.department import Department
from app.models.doctor import Doctor, DoctorSchedule
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.billing import Invoice, InvoiceItem, Payment
from app.models.pharmacy import Medicine, Prescription, PrescriptionItem
from app.models.laboratory import LabTest, LabTestOrder
from app.models.inventory import InventoryItem, InventoryTransaction
from app.models.staff import Staff, LeaveRequest

__all__ = [
    "User",
    "Department",
    "Doctor",
    "DoctorSchedule",
    "Patient",
    "Appointment",
    "Invoice",
    "InvoiceItem",
    "Payment",
    "Medicine",
    "Prescription",
    "PrescriptionItem",
    "LabTest",
    "LabTestOrder",
    "InventoryItem",
    "InventoryTransaction",
    "Staff",
    "LeaveRequest",
]
