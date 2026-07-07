"""
Inventory module endpoints - stock items and stock transactions.
"""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemOut,
    InventoryItemUpdate,
    InventoryTransactionCreate,
    InventoryTransactionOut,
)
from app.services.inventory_service import InventoryItemService, InventoryTransactionService

router = APIRouter(prefix="/inventory", tags=["Inventory"], dependencies=[Depends(get_current_user)])


@router.get("/items", response_model=List[InventoryItemOut])
def list_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return InventoryItemService(db).list(skip, limit)


@router.get("/items/low-stock", response_model=List[InventoryItemOut])
def low_stock_items(db: Session = Depends(get_db)):
    return InventoryItemService(db).low_stock()


@router.get("/items/{item_id}", response_model=InventoryItemOut)
def get_item(item_id: int, db: Session = Depends(get_db)):
    return InventoryItemService(db).get_out(item_id)


@router.post("/items", response_model=InventoryItemOut, status_code=201)
def create_item(payload: InventoryItemCreate, db: Session = Depends(get_db)):
    return InventoryItemService(db).create(payload)


@router.put("/items/{item_id}", response_model=InventoryItemOut)
def update_item(item_id: int, payload: InventoryItemUpdate, db: Session = Depends(get_db)):
    return InventoryItemService(db).update(item_id, payload)


@router.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    InventoryItemService(db).delete(item_id)


@router.get("/transactions", response_model=List[InventoryTransactionOut])
def list_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return InventoryTransactionService(db).list(skip, limit)


@router.post("/transactions", response_model=InventoryTransactionOut, status_code=201)
def create_transaction(payload: InventoryTransactionCreate, db: Session = Depends(get_db)):
    return InventoryTransactionService(db).create(payload)
