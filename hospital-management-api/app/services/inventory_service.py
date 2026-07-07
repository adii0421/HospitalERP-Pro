"""
Inventory service - stock item management and transaction ledger with
automatic quantity adjustments.
"""
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import StaffStatus  # noqa: F401 (kept for potential future cross-checks)
from app.models.inventory import InventoryItem, TransactionType
from app.repositories.inventory_repository import (
    InventoryItemRepository,
    InventoryTransactionRepository,
)
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemOut,
    InventoryItemUpdate,
    InventoryTransactionCreate,
    InventoryTransactionOut,
)


class InventoryItemService:
    def __init__(self, db: Session):
        self.repo = InventoryItemRepository(db)

    def list(self, skip: int = 0, limit: int = 100) -> List[InventoryItemOut]:
        return [InventoryItemOut.model_validate(i) for i in self.repo.get_all(skip, limit)]

    def get(self, item_id: int) -> InventoryItem:
        item = self.repo.get(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
        return item

    def get_out(self, item_id: int) -> InventoryItemOut:
        return InventoryItemOut.model_validate(self.get(item_id))

    def create(self, payload: InventoryItemCreate) -> InventoryItemOut:
        if self.repo.get_by_sku(payload.sku):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")
        item = self.repo.create(payload.model_dump())
        return InventoryItemOut.model_validate(item)

    def update(self, item_id: int, payload: InventoryItemUpdate) -> InventoryItemOut:
        item = self.get(item_id)
        item = self.repo.update(item, payload.model_dump(exclude_unset=True))
        return InventoryItemOut.model_validate(item)

    def delete(self, item_id: int) -> None:
        item = self.get(item_id)
        self.repo.delete(item)

    def low_stock(self) -> List[InventoryItemOut]:
        return [InventoryItemOut.model_validate(i) for i in self.repo.get_low_stock()]


class InventoryTransactionService:
    def __init__(self, db: Session):
        self.repo = InventoryTransactionRepository(db)
        self.item_repo = InventoryItemRepository(db)

    def _to_out(self, txn) -> InventoryTransactionOut:
        out = InventoryTransactionOut.model_validate(txn)
        out.item_name = txn.item.name if txn.item else None
        return out

    def list(self, skip: int = 0, limit: int = 100) -> List[InventoryTransactionOut]:
        return [self._to_out(t) for t in self.repo.get_all(skip, limit)]

    def create(self, payload: InventoryTransactionCreate) -> InventoryTransactionOut:
        item = self.item_repo.get(payload.item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item_id")

        if payload.transaction_type == TransactionType.STOCK_IN:
            item.quantity_in_stock += payload.quantity
        elif payload.transaction_type in (TransactionType.STOCK_OUT, TransactionType.DAMAGED):
            if item.quantity_in_stock < payload.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient stock quantity"
                )
            item.quantity_in_stock -= payload.quantity
        elif payload.transaction_type == TransactionType.ADJUSTMENT:
            item.quantity_in_stock = payload.quantity

        self.item_repo.db.add(item)
        txn = self.repo.create(payload.model_dump())
        self.item_repo.db.commit()
        self.item_repo.db.refresh(txn)
        return self._to_out(txn)
