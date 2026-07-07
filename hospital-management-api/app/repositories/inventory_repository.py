"""
Repository for InventoryItem and InventoryTransaction entities.
"""
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inventory import InventoryItem, InventoryTransaction
from app.repositories.base import BaseRepository


class InventoryItemRepository(BaseRepository[InventoryItem, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(InventoryItem, db)

    def get_by_sku(self, sku: str) -> Optional[InventoryItem]:
        stmt = select(InventoryItem).where(InventoryItem.sku == sku)
        return self.db.scalars(stmt).first()

    def get_low_stock(self) -> List[InventoryItem]:
        stmt = select(InventoryItem).where(
            InventoryItem.quantity_in_stock <= InventoryItem.reorder_level
        )
        return list(self.db.scalars(stmt).all())


class InventoryTransactionRepository(BaseRepository[InventoryTransaction, dict, dict]):
    def __init__(self, db: Session):
        super().__init__(InventoryTransaction, db)

    def get_by_item(self, item_id: int) -> List[InventoryTransaction]:
        stmt = select(InventoryTransaction).where(InventoryTransaction.item_id == item_id)
        return list(self.db.scalars(stmt).all())
