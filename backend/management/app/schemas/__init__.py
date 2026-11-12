"""Pydantic schemas package."""
from .account import AccountCreate, AccountDetail, AccountOut, AccountUpdate
from .permission import LoginGrant, LoginRequest, PermissionPayload
from .resource import ModuleResources, ResourceOut
from .template import TemplateCreate, TemplateDetail, TemplateOut, TemplateUpdate

__all__ = [
    "AccountCreate",
    "AccountDetail",
    "AccountOut",
    "AccountUpdate",
    "LoginGrant",
    "LoginRequest",
    "PermissionPayload",
    "ModuleResources",
    "ResourceOut",
    "TemplateCreate",
    "TemplateDetail",
    "TemplateOut",
    "TemplateUpdate",
]
