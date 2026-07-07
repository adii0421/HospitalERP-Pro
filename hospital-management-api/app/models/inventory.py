"""
Inventory module models - general hospital equipment / consumables stock
(distinct from pharmacy medicines), plus a transaction ledger.
"""
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
import enum


class InventoryCategory(str, enum.Enum):
    EQUIPMENT = "equipment"
    CONSUMABLE = "consumable"
    SURGICAL = "surgical"
    DIAGNOSTIC = "diagnostic"
    OFFICE_SUPPLY = "office_supply"


class TransactionType(str, enum.Enum):
    STOCK_IN = "stock_in"
    STOCK_OUT = "stock_out"
    ADJUSTMENT = "adjustment"
    DAMAGED = "damaged"


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[InventoryCategory] = mapped_column(Enum(InventoryCategory), default=InventoryCategory.CONSUMABLE)
    sku: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    unit: Mapped[str] = mapped_column(String(30), default="unit")
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0)
    quantity_in_stock: Mapped[int] = mapped_column(Integer, default=0)
    reorder_level: Mapped[int] = mapped_column(Integer, default=5)
    supplier: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)

    transactions: Mapped[List["InventoryTransaction"]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("inventory_items.id"), nullable=False)
    transaction_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    performed_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    item: Mapped["InventoryItem"] = relationship(back_populates="transactions")
