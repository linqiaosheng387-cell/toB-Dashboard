"""Pydantic schemas for permission resources and the grouped catalog."""
from pydantic import BaseModel, ConfigDict


class ResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    resource_key: str
    module_key: str
    resource_type: str
    resource_name: str
    sort_order: int


class ModuleResources(BaseModel):
    """All resources belonging to one module, grouped by type."""

    module_key: str
    module_name: str
    metrics: list[ResourceOut]
    charts: list[ResourceOut]
    fields: list[ResourceOut]
