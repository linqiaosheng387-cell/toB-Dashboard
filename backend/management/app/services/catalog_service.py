"""Business logic for reading the permission resource catalog."""
from sqlalchemy.orm import Session

from ..repositories import ResourceRepository
from ..schemas.resource import ModuleResources, ResourceOut


class CatalogService:
    def __init__(self, db: Session):
        self.resource_repository = ResourceRepository(db)

    def grouped_modules(self) -> list[ModuleResources]:
        records = self.resource_repository.list_all()
        grouped: dict[str, dict] = {}

        for record in records:
            bucket = grouped.setdefault(
                record.module_key,
                {"name": "", "metric": [], "chart": [], "field": []},
            )
            if record.resource_type == "module":
                bucket["name"] = record.resource_name
            else:
                bucket[record.resource_type].append(ResourceOut.model_validate(record))

        return [
            ModuleResources(
                module_key=module_key,
                module_name=bucket["name"],
                metrics=bucket["metric"],
                charts=bucket["chart"],
                fields=bucket["field"],
            )
            for module_key, bucket in grouped.items()
        ]
