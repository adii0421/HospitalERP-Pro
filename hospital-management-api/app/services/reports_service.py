"""
Dashboard & reports service - aggregates data across modules for
summary cards, trend charts, and breakdowns used by the frontend.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.billing import Invoice
from app.models.department import Department
from app.models.doctor import Doctor
from app.models.enums import AppointmentStatus, InvoiceStatus, LabTestStatus
from app.models.laboratory import LabTestOrder
from app.models.patient import Patient
from app.models.pharmacy import Medicine
from app.models.inventory import InventoryItem
from app.models.staff import Staff
from app.schemas.reports import (
    AppointmentStatusBreakdown,
    AppointmentTrendPoint,
    DashboardSummary,
    DepartmentLoad,
    ReportsOverview,
    RevenueTrendPoint,
)


class ReportsService:
    def __init__(self, db: Session):
        self.db = db

    def dashboard_summary(self) -> DashboardSummary:
        db = self.db
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        week_start = today_start - timedelta(days=today_start.weekday())
        week_end = week_start + timedelta(days=7)
        month_start = today_start.replace(day=1)

        total_patients = db.scalar(select(func.count()).select_from(Patient)) or 0
        total_doctors = db.scalar(select(func.count()).select_from(Doctor)) or 0
        total_departments = db.scalar(select(func.count()).select_from(Department)) or 0
        total_staff = db.scalar(select(func.count()).select_from(Staff)) or 0

        appointments_today = db.scalar(
            select(func.count()).select_from(Appointment).where(
                Appointment.scheduled_at >= today_start, Appointment.scheduled_at < today_end
            )
        ) or 0
        appointments_this_week = db.scalar(
            select(func.count()).select_from(Appointment).where(
                Appointment.scheduled_at >= week_start, Appointment.scheduled_at < week_end
            )
        ) or 0

        pending_invoices = db.scalar(
            select(func.count()).select_from(Invoice).where(
                Invoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE])
            )
        ) or 0

        revenue_this_month = db.scalar(
            select(func.coalesce(func.sum(Invoice.amount_paid), 0.0)).where(
                Invoice.issue_date >= month_start
            )
        ) or 0.0
        revenue_today = db.scalar(
            select(func.coalesce(func.sum(Invoice.amount_paid), 0.0)).where(
                Invoice.issue_date >= today_start, Invoice.issue_date < today_end
            )
        ) or 0.0

        low_stock_medicines = db.scalar(
            select(func.count()).select_from(Medicine).where(Medicine.stock_quantity <= Medicine.reorder_level)
        ) or 0
        low_stock_inventory = db.scalar(
            select(func.count()).select_from(InventoryItem).where(
                InventoryItem.quantity_in_stock <= InventoryItem.reorder_level
            )
        ) or 0

        pending_lab_tests = db.scalar(
            select(func.count()).select_from(LabTestOrder).where(
                LabTestOrder.status.in_(
                    [LabTestStatus.ORDERED, LabTestStatus.SAMPLE_COLLECTED, LabTestStatus.IN_PROGRESS]
                )
            )
        ) or 0

        return DashboardSummary(
            total_patients=total_patients,
            total_doctors=total_doctors,
            total_departments=total_departments,
            total_staff=total_staff,
            appointments_today=appointments_today,
            appointments_this_week=appointments_this_week,
            pending_invoices=pending_invoices,
            revenue_this_month=round(float(revenue_this_month), 2),
            revenue_today=round(float(revenue_today), 2),
            low_stock_medicines=low_stock_medicines,
            low_stock_inventory=low_stock_inventory,
            pending_lab_tests=pending_lab_tests,
        )

    def overview(self) -> ReportsOverview:
        db = self.db
        now = datetime.now(timezone.utc)

        # Revenue trend: last 6 months
        revenue_trend: list[RevenueTrendPoint] = []
        for i in range(5, -1, -1):
            year = now.year
            month = now.month - i
            while month <= 0:
                month += 12
                year -= 1
            start = datetime(year, month, 1, tzinfo=timezone.utc)
            if month == 12:
                end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
            total = db.scalar(
                select(func.coalesce(func.sum(Invoice.amount_paid), 0.0)).where(
                    Invoice.issue_date >= start, Invoice.issue_date < end
                )
            ) or 0.0
            revenue_trend.append(
                RevenueTrendPoint(label=start.strftime("%b %Y"), revenue=round(float(total), 2))
            )

        # Appointment trend: last 7 days
        appointment_trend: list[AppointmentTrendPoint] = []
        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            next_day = day + timedelta(days=1)
            count = db.scalar(
                select(func.count()).select_from(Appointment).where(
                    Appointment.scheduled_at >= day, Appointment.scheduled_at < next_day
                )
            ) or 0
            appointment_trend.append(AppointmentTrendPoint(label=day.strftime("%a"), count=count))

        # Department load
        departments = db.scalars(select(Department)).all()
        department_load: list[DepartmentLoad] = []
        for dept in departments:
            doctor_ids = [d.id for d in dept.doctors]
            appt_count = 0
            if doctor_ids:
                appt_count = db.scalar(
                    select(func.count()).select_from(Appointment).where(Appointment.doctor_id.in_(doctor_ids))
                ) or 0
            department_load.append(
                DepartmentLoad(
                    department_name=dept.name,
                    doctor_count=len(dept.doctors),
                    appointment_count=appt_count,
                )
            )

        # Appointment status breakdown
        status_breakdown: list[AppointmentStatusBreakdown] = []
        for status_enum in AppointmentStatus:
            count = db.scalar(
                select(func.count()).select_from(Appointment).where(Appointment.status == status_enum)
            ) or 0
            status_breakdown.append(AppointmentStatusBreakdown(status=status_enum.value, count=count))

        # Top doctors by appointment count
        rows = db.execute(
            select(Doctor.full_name, func.count(Appointment.id).label("cnt"))
            .join(Appointment, Appointment.doctor_id == Doctor.id, isouter=True)
            .group_by(Doctor.id)
            .order_by(func.count(Appointment.id).desc())
            .limit(5)
        ).all()
        top_doctors = [{"doctor_name": row[0], "appointment_count": row[1]} for row in rows]

        return ReportsOverview(
            revenue_trend=revenue_trend,
            appointment_trend=appointment_trend,
            department_load=department_load,
            appointment_status_breakdown=status_breakdown,
            top_doctors_by_appointments=top_doctors,
        )
