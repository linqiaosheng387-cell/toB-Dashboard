"""Routes for permission templates (one-click presets)."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...schemas.template import TemplateCreate, TemplateDetail, TemplateUpdate
from ...services import TemplateService

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=list[TemplateDetail])
def list_templates(db: Session = Depends(get_db)):
    return TemplateService(db).list_details()


@router.get("/{template_id}", response_model=TemplateDetail)
def get_template(template_id: int, db: Session = Depends(get_db)):
    return TemplateService(db).get_detail(template_id)


@router.post("", response_model=TemplateDetail, status_code=status.HTTP_201_CREATED)
def create_template(payload: TemplateCreate, db: Session = Depends(get_db)):
    return TemplateService(db).create(payload)


@router.patch("/{template_id}", response_model=TemplateDetail)
def update_template(template_id: int, payload: TemplateUpdate, db: Session = Depends(get_db)):
    return TemplateService(db).update(template_id, payload)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: int, db: Session = Depends(get_db)):
    TemplateService(db).delete(template_id)
