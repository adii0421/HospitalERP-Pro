"""
FastAPI application entrypoint - wires together CORS, routers, and DB init.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
import app.models  # noqa: F401  (ensures all models are registered on Base.metadata)
from app.routers import (
    appointment_router,
    auth_router,
    billing_router,
    department_router,
    doctor_router,
    inventory_router,
    laboratory_router,
    patient_router,
    pharmacy_router,
    reports_router,
    staff_router,
    user_router,
)

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": settings.PROJECT_NAME}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}


API_PREFIX = settings.API_V1_STR

app.include_router(auth_router.router, prefix=API_PREFIX)
app.include_router(user_router.router, prefix=API_PREFIX)
app.include_router(department_router.router, prefix=API_PREFIX)
app.include_router(doctor_router.router, prefix=API_PREFIX)
app.include_router(patient_router.router, prefix=API_PREFIX)
app.include_router(appointment_router.router, prefix=API_PREFIX)
app.include_router(billing_router.router, prefix=API_PREFIX)
app.include_router(pharmacy_router.router, prefix=API_PREFIX)
app.include_router(laboratory_router.router, prefix=API_PREFIX)
app.include_router(inventory_router.router, prefix=API_PREFIX)
app.include_router(staff_router.router, prefix=API_PREFIX)
app.include_router(reports_router.router, prefix=API_PREFIX)
