"""Data access for permission resources."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.resource import PermissionResource


class ResourceRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[PermissionResource]:
        statement = select(PermissionResource).order_by(
            PermissionResource.module_key, PermissionResource.sort_order
        )
        return list(self.db.scalars(statement))

    def list_by_module(self, module_key: str) -> list[PermissionResource]:
        statement = (
            select(PermissionResource)
            .where(PermissionResource.module_key == module_key)
            .order_by(PermissionResource.sort_order)
        )
        return list(self.db.scalars(statement))

    def existing_keys(self, keys: set[str]) -> set[str]:
        """Return the subset of keys that actually exist in the dictionary."""
        if not keys:
            return set()
        statement = select(PermissionResource.resource_key).where(
            PermissionResource.resource_key.in_(keys)
        )
        return set(self.db.scalars(statement))
