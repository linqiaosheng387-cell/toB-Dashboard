"""Data access for accounts."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models.account import Account


class AccountRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[Account]:
        statement = select(Account).order_by(Account.id)
        return list(self.db.scalars(statement))

    def get(self, account_id: int) -> Account | None:
        return self.db.get(Account, account_id)

    def get_by_name(self, account: str) -> Account | None:
        statement = select(Account).where(Account.account == account)
        return self.db.scalars(statement).first()

    def exists(self, account: str) -> bool:
        return self.get_by_name(account) is not None

    def create(self, account: str, password_hash: str, company: str) -> Account:
        record = Account(
            account=account, password_hash=password_hash, company=company
        )
        self.db.add(record)
        self.db.flush()
        return record
