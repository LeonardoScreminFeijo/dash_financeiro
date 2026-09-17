"""Contratos de persistência consumidos pelos serviços do domínio."""

from typing import Protocol, runtime_checkable
from uuid import UUID

from python_backend.domain import (
    Account,
    Budget,
    Card,
    Category,
    Installment,
    RecurringTransaction,
    Transaction,
)


@runtime_checkable
class TransactionRepository(Protocol):
    """Persistência de movimentações sem conhecer o armazenamento subjacente."""

    def list_unprocessed_transactions(self) -> list[Transaction]:
        """Lista movimentações pendentes de processamento."""
        ...

    def get_transaction_by_id(self, transaction_id: UUID) -> Transaction | None:
        """Busca uma movimentação pelo seu identificador estável."""
        ...

    def create_transaction(self, transaction: Transaction) -> Transaction:
        """Cria uma movimentação já validada pelo domínio."""
        ...

    def update_transaction(self, transaction: Transaction) -> Transaction:
        """Atualiza uma movimentação existente."""
        ...

    def mark_transaction_processed(self, transaction_id: UUID) -> None:
        """Marca uma movimentação como processada somente após sucesso total."""
        ...


@runtime_checkable
class InstallmentRepository(Protocol):
    """Persistência das parcelas derivadas de uma movimentação."""

    def list_installments(self, transaction_id: UUID | None = None) -> list[Installment]:
        """Lista parcelas, opcionalmente filtradas pela movimentação de origem."""
        ...

    def create_installments(self, installments: list[Installment]) -> list[Installment]:
        """Persiste uma coleção de parcelas validada pelo serviço correspondente."""
        ...


@runtime_checkable
class RecurringRepository(Protocol):
    """Persistência das definições de recorrência."""

    def list_recurring(self) -> list[RecurringTransaction]:
        """Lista todas as recorrências cadastradas."""
        ...

    def update_recurring(self, recurring: RecurringTransaction) -> RecurringTransaction:
        """Atualiza uma recorrência, incluindo seu último lançamento."""
        ...


@runtime_checkable
class AccountRepository(Protocol):
    """Consulta de contas disponíveis para o domínio."""

    def list_accounts(self) -> list[Account]:
        """Lista contas cadastradas."""
        ...


@runtime_checkable
class CardRepository(Protocol):
    """Consulta de cartões e seus ciclos financeiros."""

    def list_cards(self) -> list[Card]:
        """Lista cartões cadastrados."""
        ...


@runtime_checkable
class CategoryRepository(Protocol):
    """Consulta da fonte de verdade de categorias."""

    def list_categories(self) -> list[Category]:
        """Lista categorias cadastradas."""
        ...


@runtime_checkable
class BudgetRepository(Protocol):
    """Consulta dos limites orçamentários cadastrados."""

    def list_budgets(self) -> list[Budget]:
        """Lista orçamentos cadastrados."""
        ...
