"""
Laboratory module endpoints - test catalog and patient test orders.
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.laboratory import (
    LabTestCreate,
    LabTestOrderCreate,
    LabTestOrderOut,
    LabTestOrderUpdate,
    LabTestOut,
    LabTestUpdate,
)
from app.services.laboratory_service import LabTestOrderService, LabTestService

router = APIRouter(prefix="/laboratory", tags=["Laboratory"], dependencies=[Depends(get_current_user)])


@router.get("/tests", response_model=List[LabTestOut])
def list_tests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return LabTestService(db).list(skip, limit)


@router.get("/tests/{test_id}", response_model=LabTestOut)
def get_test(test_id: int, db: Session = Depends(get_db)):
    return LabTestService(db).get_out(test_id)


@router.post("/tests", response_model=LabTestOut, status_code=201)
def create_test(payload: LabTestCreate, db: Session = Depends(get_db)):
    return LabTestService(db).create(payload)


@router.put("/tests/{test_id}", response_model=LabTestOut)
def update_test(test_id: int, payload: LabTestUpdate, db: Session = Depends(get_db)):
    return LabTestService(db).update(test_id, payload)


@router.delete("/tests/{test_id}", status_code=204)
def delete_test(test_id: int, db: Session = Depends(get_db)):
    LabTestService(db).delete(test_id)


@router.get("/orders", response_model=List[LabTestOrderOut])
def list_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return LabTestOrderService(db).list(skip, limit)


@router.get("/orders/pending", response_model=List[LabTestOrderOut])
def pending_orders(db: Session = Depends(get_db)):
    return LabTestOrderService(db).pending()


@router.get("/orders/{order_id}", response_model=LabTestOrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return LabTestOrderService(db).get_out(order_id)


@router.post("/orders", response_model=LabTestOrderOut, status_code=201)
def create_order(payload: LabTestOrderCreate, db: Session = Depends(get_db)):
    return LabTestOrderService(db).create(payload)


@router.put("/orders/{order_id}", response_model=LabTestOrderOut)
def update_order(order_id: int, payload: LabTestOrderUpdate, db: Session = Depends(get_db)):
    return LabTestOrderService(db).update(order_id, payload)


@router.delete("/orders/{order_id}", status_code=204)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    LabTestOrderService(db).delete(order_id)
