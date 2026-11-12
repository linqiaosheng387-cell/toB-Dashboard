"""Aggregate API router."""
from fastapi import APIRouter

from .routes import accounts, auth, catalog, templates

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(catalog.router)
api_router.include_router(accounts.router)
api_router.include_router(templates.router)
