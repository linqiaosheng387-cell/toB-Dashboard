"""Data access for permission templates."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.template import PermissionTemplate


class TemplateRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[PermissionTemplate]:
        statement = select(PermissionTemplate).order_by(PermissionTemplate.id)
        return list(self.db.scalars(statement))

    def get(self, template_id: int) -> PermissionTemplate | None:
        return self.db.get(PermissionTemplate, template_id)

    def get_by_name(self, name: str) -> PermissionTemplate | None:
        statement = select(PermissionTemplate).where(PermissionTemplate.name == name)
        return self.db.scalars(statement).first()

    def create(self, name: str, description: str | None) -> PermissionTemplate:
        record = PermissionTemplate(name=name, description=description, is_builtin=0)
        self.db.add(record)
        self.db.flush()
        return record
