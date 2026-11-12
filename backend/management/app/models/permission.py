"""ORM models for template and account permission items."""
from sqlalchemy import ForeignKey, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class PermissionTemplateItem(Base):
    __tablename__ = "tob_permission_template_items"

    template_id: Mapped[int] = mapped_column(
        ForeignKey("tob_permission_templates.id", ondelete="CASCADE"), primary_key=True
    )
    resource_key: Mapped[str] = mapped_column(
        ForeignKey("tob_permission_resources.resource_key"), primary_key=True
    )
    enabled: Mapped[int] = mapped_column(SmallInteger, default=1)

    template = relationship("PermissionTemplate", back_populates="items")


class AccountPermissionItem(Base):
    __tablename__ = "tob_account_permission_items"

    account_id: Mapped[int] = mapped_column(
        ForeignKey("tob_accounts.id", ondelete="CASCADE"), primary_key=True
    )
    resource_key: Mapped[str] = mapped_column(
        ForeignKey("tob_permission_resources.resource_key"), primary_key=True
    )
    enabled: Mapped[int] = mapped_column(SmallInteger, default=1)

    account = relationship("Account", back_populates="permission_items")
