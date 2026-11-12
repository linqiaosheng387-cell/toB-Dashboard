"""ORM model for the permission resource dictionary."""
from sqlalchemy import Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base


class PermissionResource(Base):
    __tablename__ = "tob_permission_resources"

    resource_key: Mapped[str] = mapped_column(String(96), primary_key=True)
    module_key: Mapped[str] = mapped_column(String(16), index=True)
    resource_type: Mapped[str] = mapped_column(
        Enum("module", "metric", "chart", "field", name="resource_type")
    )
    resource_name: Mapped[str] = mapped_column(String(64))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
