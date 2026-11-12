"""Pydantic schemas for permission payloads and login grants."""
from pydantic import BaseModel


class PermissionPayload(BaseModel):
    """Enabled resource keys for an account or a template."""

    resource_keys: list[str]


class LoginRequest(BaseModel):
    account: str
    password: str


class LoginGrant(BaseModel):
    """Effective permission set returned after a successful login."""

    account: str
    company: str
    status: str
    resource_keys: list[str]
