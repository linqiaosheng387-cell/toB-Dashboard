"""ORM model for login accounts."""
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class Account(Base):
    __tablename__ = "tob_accounts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    account: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    company: Mapped[str] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(
        Enum("active", "blocked", name="account_status"), default="active"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    permission_items = relationship(
        "AccountPermissionItem",
        back_populates="account",
        cascade="all, delete-orphan",
    )
