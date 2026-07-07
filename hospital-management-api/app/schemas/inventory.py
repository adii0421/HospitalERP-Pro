"""
Inventory module Pydantic schemas.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.inventory import InventoryCategory, TransactionType


class InventoryItemBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    category: InventoryCategory = InventoryCategory.CONSUMABLE
    sku: str = Field(..., min_length=2, max_length=50)
    unit: str = "unit"
    unit_cost: float = Field(0.0, ge=0)
    quantity_in_stock: int = Field(0, ge=0)
    reorder_level: int = Field(5, ge=0)
    supplier: Optional[str] = None
    location: Optional[str] = None


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[InventoryCategory] = None
    sku: Optional[str] = None
    unit: Optional[str] = None
    unit_cost: Optional[float] = Field(None, ge=0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)
    supplier: Optional[str] = None
    location: Optional[str] = None


class InventoryItemOut(InventoryItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class InventoryTransactionBase(BaseModel):
    item_id: int
    transaction_type: TransactionType
    quantity: int = Field(..., gt=0)
    reason: Optional[str] = None


class InventoryTransactionCreate(InventoryTransactionBase):
    pass


class InventoryTransactionOut(InventoryTransactionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    performed_at: datetime
    item_name: Optional[str] = None
