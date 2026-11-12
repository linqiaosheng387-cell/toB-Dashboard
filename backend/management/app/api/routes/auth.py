"""Authentication and self-service password routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...schemas.account import AccountDetail, ChangePasswordRequest
from ...schemas.permission import LoginGrant, LoginRequest
from ...services import AccountService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginGrant)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return AccountService(db).authenticate(payload.account, payload.password)


@router.post("/change-password", response_model=AccountDetail)
def change_password(payload: ChangePasswordRequest, db: Session = Depends(get_db)):
    return AccountService(db).change_password(
        payload.account, payload.old_password, payload.new_password
    )
