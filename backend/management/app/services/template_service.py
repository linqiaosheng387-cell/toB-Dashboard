"""Business logic for permission templates."""
from sqlalchemy.orm import Session

from ..repositories import (
    PermissionRepository,
    ResourceRepository,
    TemplateRepository,
)
from ..schemas.template import TemplateCreate, TemplateDetail, TemplateUpdate
from .errors import ConflictError, NotFoundError, ServiceError


class TemplateService:
    def __init__(self, db: Session):
        self.db = db
        self.templates = TemplateRepository(db)
        self.permissions = PermissionRepository(db)
        self.resources = ResourceRepository(db)

    def list_details(self) -> list[TemplateDetail]:
        return [self._build_detail(record) for record in self.templates.list_all()]

    def get_detail(self, template_id: int) -> TemplateDetail:
        return self._build_detail(self._require(template_id))

    def create(self, payload: TemplateCreate) -> TemplateDetail:
        if self.templates.get_by_name(payload.name) is not None:
            raise ConflictError("模板名称已存在")
        record = self.templates.create(payload.name, payload.description)
        valid_keys = self.resources.existing_keys(set(payload.resource_keys))
        self.permissions.replace_template_permissions(record.id, list(valid_keys))
        self.db.commit()
        return self._build_detail(record)

    def update(self, template_id: int, payload: TemplateUpdate) -> TemplateDetail:
        record = self._require(template_id)
        if payload.name is not None:
            duplicate = self.templates.get_by_name(payload.name)
            if duplicate is not None and duplicate.id != record.id:
                raise ConflictError("模板名称已存在")
            record.name = payload.name
        if payload.description is not None:
            record.description = payload.description
        if payload.resource_keys is not None:
            valid_keys = self.resources.existing_keys(set(payload.resource_keys))
            self.permissions.replace_template_permissions(record.id, list(valid_keys))
        self.db.commit()
        return self._build_detail(record)

    def delete(self, template_id: int) -> None:
        record = self._require(template_id)
        if record.is_builtin:
            raise ServiceError("内置模板不可删除")
        self.db.delete(record)
        self.db.commit()

    def _require(self, template_id: int):
        record = self.templates.get(template_id)
        if record is None:
            raise NotFoundError("模板不存在")
        return record

    def _build_detail(self, record) -> TemplateDetail:
        return TemplateDetail(
            id=record.id,
            name=record.name,
            description=record.description,
            is_builtin=record.is_builtin,
            created_at=record.created_at,
            updated_at=record.updated_at,
            resource_keys=self.permissions.get_template_keys(record.id),
        )
