"""Pydantic schemas for account creation, updates and responses."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AccountCreate(BaseModel):
    account: str = Field(min_length=3, max_length=128)
    password: str = Field(min_length=1, max_length=128)
    company: str = Field(min_length=1, max_length=128)
    resource_keys: list[str] = Field(default_factory=list)


class AccountUpdate(BaseModel):
    company: str | None = None
    password: str | None = None
    status: str | None = Field(default=None, pattern="^(active|blocked)$")
    resource_keys: list[str] | None = None


class AccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account: str
    company: str
    status: str
    created_at: datetime
    last_login_at: datetime | None


class AccountDetail(AccountOut):
    resource_keys: list[str]


class ChangePasswordRequest(BaseModel):
    """Admin changes own password; the old password must be verified."""

    account: str = Field(min_length=1, max_length=128)
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class ResetPasswordRequest(BaseModel):
    """Admin resets another account's password; empty means the default one."""

    new_password: str | None = Field(default=None, min_length=6, max_length=128)
