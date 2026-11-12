"""Business-level exceptions mapped to HTTP responses by the API layer."""


class ServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(ServiceError):
    def __init__(self, message: str):
        super().__init__(message, 404)


class ConflictError(ServiceError):
    def __init__(self, message: str):
        super().__init__(message, 409)
