"""FastAPI application factory for the management service."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.router import api_router
from .core.config import get_settings
from .services.errors import ServiceError


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Fleet Management API",
        description="账号、细粒度权限与权限模板服务",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        # Also allow any local dev/preview port (e.g. Vite auto-incrementing ports).
        allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(ServiceError)
    async def handle_service_error(request: Request, exc: ServiceError):
        return JSONResponse(
            status_code=exc.status_code, content={"detail": exc.message}
        )

    app.include_router(api_router)
    return app


app = create_app()
