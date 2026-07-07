"""
Dashboard summary and reports endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.reports import DashboardSummary, ReportsOverview
from app.services.reports_service import ReportsService

router = APIRouter(prefix="/reports", tags=["Reports & Dashboard"], dependencies=[Depends(get_current_user)])


@router.get("/dashboard-summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    return ReportsService(db).dashboard_summary()


@router.get("/overview", response_model=ReportsOverview)
def reports_overview(db: Session = Depends(get_db)):
    return ReportsService(db).overview()
