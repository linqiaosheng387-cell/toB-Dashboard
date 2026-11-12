"""Routes for account management and fine-grained permissions."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...schemas.account import (
    AccountCreate,
    AccountDetail,
    AccountUpdate,
    ResetPasswordRequest,
)
from ...services import AccountService

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[AccountDetail])
def list_accounts(db: Session = Depends(get_db)):
    return AccountService(db).list_details()


@router.get("/{account_id}", response_model=AccountDetail)
def get_account(account_id: int, db: Session = Depends(get_db)):
    return AccountService(db).get_detail(account_id)


@router.post("", response_model=AccountDetail, status_code=status.HTTP_201_CREATED)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)):
    return AccountService(db).create(payload)


@router.patch("/{account_id}", response_model=AccountDetail)
def update_account(account_id: int, payload: AccountUpdate, db: Session = Depends(get_db)):
    return AccountService(db).update(account_id, payload)


@router.post("/{account_id}/reset-password", response_model=AccountDetail)
def reset_password(
    account_id: int, payload: ResetPasswordRequest, db: Session = Depends(get_db)
):
    return AccountService(db).reset_password(account_id, payload.new_password)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    AccountService(db).delete(account_id)


@router.post("/{account_id}/apply-template", response_model=AccountDetail)
def apply_template(account_id: int, template_id: int, db: Session = Depends(get_db)):
    return AccountService(db).apply_template(account_id, template_id)
