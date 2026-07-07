"""
Department module endpoints.
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.department import DepartmentCreate, DepartmentOut, DepartmentUpdate
from app.services.department_service import DepartmentService

router = APIRouter(prefix="/departments", tags=["Departments"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=List[DepartmentOut])
def list_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return DepartmentService(db).list(skip, limit)


@router.get("/{department_id}", response_model=DepartmentOut)
def get_department(department_id: int, db: Session = Depends(get_db)):
    return DepartmentService(db).get_out(department_id)


@router.post("/", response_model=DepartmentOut, status_code=201)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db)):
    return DepartmentService(db).create(payload)


@router.put("/{department_id}", response_model=DepartmentOut)
def update_department(department_id: int, payload: DepartmentUpdate, db: Session = Depends(get_db)):
    return DepartmentService(db).update(department_id, payload)


@router.delete("/{department_id}", status_code=204)
def delete_department(department_id: int, db: Session = Depends(get_db)):
    DepartmentService(db).delete(department_id)
