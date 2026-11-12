"""Data access for account and template permission items."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.permission import AccountPermissionItem, PermissionTemplateItem


class PermissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_account_keys(self, account_id: int) -> list[str]:
        statement = select(AccountPermissionItem.resource_key).where(
            AccountPermissionItem.account_id == account_id,
            AccountPermissionItem.enabled == 1,
        )
        return list(self.db.scalars(statement))

    def get_template_keys(self, template_id: int) -> list[str]:
        statement = select(PermissionTemplateItem.resource_key).where(
            PermissionTemplateItem.template_id == template_id,
            PermissionTemplateItem.enabled == 1,
        )
        return list(self.db.scalars(statement))

    def replace_account_permissions(
        self, account_id: int, resource_keys: list[str]
    ) -> None:
        self.db.query(AccountPermissionItem).filter(
            AccountPermissionItem.account_id == account_id
        ).delete(synchronize_session=False)
        for key in dict.fromkeys(resource_keys):
            self.db.add(
                AccountPermissionItem(
                    account_id=account_id, resource_key=key, enabled=1
                )
            )
        self.db.flush()

    def replace_template_permissions(
        self, template_id: int, resource_keys: list[str]
    ) -> None:
        self.db.query(PermissionTemplateItem).filter(
            PermissionTemplateItem.template_id == template_id
        ).delete(synchronize_session=False)
        for key in dict.fromkeys(resource_keys):
            self.db.add(
                PermissionTemplateItem(
                    template_id=template_id, resource_key=key, enabled=1
                )
            )
        self.db.flush()
