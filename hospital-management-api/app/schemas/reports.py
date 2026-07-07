"""
Dashboard summary and reports Pydantic schemas.
"""
from typing import List, Optional

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_patients: int
    total_doctors: int
    total_departments: int
    total_staff: int
    appointments_today: int
    appointments_this_week: int
    pending_invoices: int
    revenue_this_month: float
    revenue_today: float
    low_stock_medicines: int
    low_stock_inventory: int
    pending_lab_tests: int


class RevenueTrendPoint(BaseModel):
    label: str
    revenue: float


class AppointmentTrendPoint(BaseModel):
    label: str
    count: int


class DepartmentLoad(BaseModel):
    department_name: str
    doctor_count: int
    appointment_count: int


class AppointmentStatusBreakdown(BaseModel):
    status: str
    count: int


class ReportsOverview(BaseModel):
    revenue_trend: List[RevenueTrendPoint]
    appointment_trend: List[AppointmentTrendPoint]
    department_load: List[DepartmentLoad]
    appointment_status_breakdown: List[AppointmentStatusBreakdown]
    top_doctors_by_appointments: List[dict]
