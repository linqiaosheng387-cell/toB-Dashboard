"""Business logic for accounts, their permissions and authentication."""
from datetime import datetime

from sqlalchemy.orm import Session

from ..core.security import hash_password, verify_password
from ..repositories import (
    AccountRepository,
    PermissionRepository,
    ResourceRepository,
    TemplateRepository,
)
from ..schemas.account import AccountCreate, AccountDetail, AccountUpdate
from ..schemas.permission import LoginGrant
from .errors import ConflictError, NotFoundError, ServiceError

ADMIN_ACCOUNT = "admin"
DEFAULT_RESET_PASSWORD = "123456"


class AccountService:
    def __init__(self, db: Session):
        self.db = db
        self.accounts = AccountRepository(db)
        self.permissions = PermissionRepository(db)
        self.resources = ResourceRepository(db)
        self.templates = TemplateRepository(db)

    def list_details(self) -> list[AccountDetail]:
        return [self._build_detail(record) for record in self.accounts.list_all()]

    def get_detail(self, account_id: int) -> AccountDetail:
        return self._build_detail(self._require_account(account_id))

    def create(self, payload: AccountCreate) -> AccountDetail:
        if self.accounts.exists(payload.account):
            raise ConflictError(f"账号 {payload.account} 已存在")
        record = self.accounts.create(
            account=payload.account,
            password_hash=hash_password(payload.password),
            company=payload.company,
        )
        valid_keys = self.resources.existing_keys(set(payload.resource_keys))
        self.permissions.replace_account_permissions(record.id, list(valid_keys))
        self.db.commit()
        return self._build_detail(record)

    def update(self, account_id: int, payload: AccountUpdate) -> AccountDetail:
        record = self._require_account(account_id)
        if payload.company is not None:
            record.company = payload.company
        if payload.password is not None:
            record.password_hash = hash_password(payload.password)
        if payload.status is not None:
            record.status = payload.status
        if payload.resource_keys is not None:
            valid_keys = self.resources.existing_keys(set(payload.resource_keys))
            self.permissions.replace_account_permissions(record.id, list(valid_keys))
        self.db.commit()
        return self._build_detail(record)

    def apply_template(self, account_id: int, template_id: int) -> AccountDetail:
        record = self._require_account(account_id)
        if self.templates.get(template_id) is None:
            raise NotFoundError("权限模板不存在")
        template_keys = self.permissions.get_template_keys(template_id)
        self.permissions.replace_account_permissions(record.id, template_keys)
        self.db.commit()
        return self._build_detail(record)

    def delete(self, account_id: int) -> None:
        record = self._require_account(account_id)
        self.db.delete(record)
        self.db.commit()

    def authenticate(self, account: str, password: str) -> LoginGrant:
        record = self.accounts.get_by_name(account)
        if record is None or not verify_password(password, record.password_hash):
            raise ServiceError("账号或密码错误", 401)
        if record.status == "blocked":
            raise ServiceError("账号已被封锁，请联系管理员", 403)
        record.last_login_at = datetime.now()
        self.db.commit()
        return LoginGrant(
            account=record.account,
            company=record.company,
            status=record.status,
            resource_keys=self.permissions.get_account_keys(record.id),
        )

    def change_password(
        self, account: str, old_password: str, new_password: str
    ) -> AccountDetail:
        """Admin changes own password after verifying the old one."""
        record = self.accounts.get_by_name(account)
        if record is None or not verify_password(old_password, record.password_hash):
            raise ServiceError("账号不存在或原密码错误", 400)
        if account != ADMIN_ACCOUNT:
            raise ServiceError("仅管理员账号可自行修改密码", 403)
        record.password_hash = hash_password(new_password)
        self.db.commit()
        return self._build_detail(record)

    def reset_password(
        self, account_id: int, new_password: str | None = None
    ) -> AccountDetail:
        """Admin resets another account's password (default 123456)."""
        record = self._require_account(account_id)
        if record.account == ADMIN_ACCOUNT:
            raise ServiceError("管理员账号请使用“修改密码”功能", 400)
        final_password = new_password or DEFAULT_RESET_PASSWORD
        record.password_hash = hash_password(final_password)
        self.db.commit()
        return self._build_detail(record)

    def _require_account(self, account_id: int):
        record = self.accounts.get(account_id)
        if record is None:
            raise NotFoundError("账号不存在")
        return record

    def _build_detail(self, record) -> AccountDetail:
        return AccountDetail(
            id=record.id,
            account=record.account,
            company=record.company,
            status=record.status,
            created_at=record.created_at,
            last_login_at=record.last_login_at,
            resource_keys=self.permissions.get_account_keys(record.id),
        )
