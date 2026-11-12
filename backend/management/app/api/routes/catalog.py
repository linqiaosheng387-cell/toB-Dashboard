"""Routes for reading the permission resource catalog."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...schemas.resource import ModuleResources
from ...services import CatalogService

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("", response_model=list[ModuleResources])
def get_catalog(db: Session = Depends(get_db)):
    return CatalogService(db).grouped_modules()
