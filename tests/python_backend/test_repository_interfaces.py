"""Testes dos contratos de repositório sem dependência de infraestrutura externa."""

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from uuid import UUID

from python_backend.domain import Transaction, TransactionType
from python_backend.repositories import TransactionRepository

TRANSACTION_ID = UUID("6945b5c8-af64-488a-a6e6-a8f0a54598c8")


@dataclass
class InMemoryTransactionRepository:
    """Fake de repositório usado para testar serviços sem Google Sheets."""

    transactions: list[Transaction] = field(default_factory=list)

    def list_unprocessed_transactions(self) -> list[Transaction]:
        return [transaction for transaction in self.transactions if not transaction.processed]

    def get_transaction_by_id(self, transaction_id: UUID) -> Transaction | None:
        return next(
            (transaction for transaction in self.transactions if transaction.id == transaction_id),
            None,
        )

    def create_transaction(self, transaction: Transaction) -> Transaction:
        self.transactions.append(transaction)
        return transaction

    def update_transaction(self, transaction: Transaction) -> Transaction:
        for index, stored_transaction in enumerate(self.transactions):
            if stored_transaction.id == transaction.id:
                self.transactions[index] = transaction
                return transaction
        raise LookupError("Movimentação inexistente.")

    def mark_transaction_processed(self, transaction_id: UUID) -> None:
        transaction = self.get_transaction_by_id(transaction_id)
        if transaction is None:
            raise LookupError("Movimentação inexistente.")
        transaction.processed = True


def test_in_memory_repository_conforms_to_transaction_contract() -> None:
    """O contrato pode ser atendido por um fake sem qualquer chamada ao Sheets."""
    repository = InMemoryTransactionRepository()
    transaction = Transaction(
        id=TRANSACTION_ID,
        transaction_date=date(2026, 9, 17),
        transaction_type=TransactionType.EXPENSE,
        category="Alimentação",
        description="Mercado",
        amount=Decimal("120.00"),
    )

    assert isinstance(repository, TransactionRepository)
    assert repository.create_transaction(transaction) is transaction
    assert repository.list_unprocessed_transactions() == [transaction]
    assert repository.get_transaction_by_id(TRANSACTION_ID) is transaction

    repository.mark_transaction_processed(TRANSACTION_ID)

    assert repository.list_unprocessed_transactions() == []
    assert repository.update_transaction(transaction) is transaction
