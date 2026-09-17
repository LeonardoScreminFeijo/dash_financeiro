"""Testes dos enums e modelos do domínio financeiro."""

from datetime import date
from decimal import Decimal
from uuid import UUID

import pytest
from pydantic import ValidationError

from python_backend.domain import (
    Account,
    BankTransaction,
    Budget,
    Card,
    Category,
    Installment,
    InstallmentStatus,
    MatchStatus,
    PaymentMethod,
    ReconciliationResult,
    RecurringTransaction,
    Transaction,
    TransactionOrigin,
    TransactionType,
)

TRANSACTION_ID = UUID("7d99d4f2-327a-4e58-b670-cc57b77e9b3a")
INSTALLMENT_ID = UUID("bffb43b1-1f4f-463a-a985-d51f66a0e3aa")
GROUP_ID = UUID("f916209a-2e80-4ecf-b6e7-95b11b205238")
ACCOUNT_ID = UUID("02e100d3-8a61-4f3c-b863-0252a4916f6c")


def test_enums_expose_canonical_values() -> None:
    """Os valores persistidos devem seguir o contrato da planilha."""
    assert {item.value for item in TransactionType} == {"expense", "income", "transfer", "refund"}
    assert {item.value for item in TransactionOrigin} == {
        "Siri",
        "Manual",
        "Extrato",
        "Recorrente",
        "Teste",
    }
    assert {item.value for item in InstallmentStatus} == {"Pendente", "Pago", "Cancelado"}
    assert {item.value for item in MatchStatus} == {"MATCHED", "REVIEW", "NEW"}
    assert PaymentMethod.CREDIT_CARD.value == "Cartão de Crédito"


def test_transaction_keeps_money_as_decimal_and_optional_id() -> None:
    """O processor futuro pode receber uma transação sem ID para preenchê-lo."""
    transaction = Transaction(
        transaction_date=date(2026, 9, 17),
        transaction_type=TransactionType.EXPENSE,
        category="Alimentação",
        description="Mercado",
        amount=Decimal("87.50"),
        payment_method=PaymentMethod.PIX,
    )

    assert transaction.id is None
    assert transaction.amount == Decimal("87.50")
    assert transaction.installments == 1


@pytest.mark.parametrize("amount", [Decimal("0"), Decimal("-1"), 12.5])
def test_transaction_rejects_invalid_financial_amount(amount: Decimal | float) -> None:
    """Valores monetários do domínio não aceitam zero, negativo ou float."""
    with pytest.raises(ValidationError):
        Transaction(
            transaction_date=date(2026, 9, 17),
            transaction_type=TransactionType.EXPENSE,
            category="Alimentação",
            description="Mercado",
            amount=amount,
        )


def test_installment_requires_consistent_number_and_payment_state() -> None:
    """Uma parcela paga precisa ter data e número dentro do total contratado."""
    installment = Installment(
        id=INSTALLMENT_ID,
        installment_group_id=GROUP_ID,
        transaction_id=TRANSACTION_ID,
        description="Notebook",
        total_amount=Decimal("3000.00"),
        installment_number=1,
        installments_total=10,
        installment_amount=Decimal("300.00"),
        competence="2026-10",
        due_date=date(2026, 10, 10),
        status=InstallmentStatus.PAID,
        paid_at=date(2026, 10, 9),
    )

    assert installment.status is InstallmentStatus.PAID

    with pytest.raises(ValidationError):
        Installment(
            **installment.model_dump(exclude={"paid_at", "status"}),
            status=InstallmentStatus.PAID,
        )

    with pytest.raises(ValidationError):
        Installment(
            **installment.model_dump(exclude={"installment_number", "status", "paid_at"}),
            installment_number=11,
            status=InstallmentStatus.PENDING,
            paid_at=None,
        )


def test_recurring_transaction_rejects_reversed_date_range() -> None:
    """Recorrências não podem terminar antes de começar."""
    with pytest.raises(ValidationError):
        RecurringTransaction(
            id=TRANSACTION_ID,
            active=True,
            description="Streaming",
            transaction_type=TransactionType.EXPENSE,
            category="Lazer",
            amount=Decimal("39.90"),
            day=10,
            start_date=date(2026, 10, 1),
            end_date=date(2026, 9, 30),
        )


def test_reference_models_use_uuid_decimal_and_dates() -> None:
    """Cadastros futuros mantêm os tipos de domínio, sem strings financeiras."""
    account = Account(id=ACCOUNT_ID, name="Conta conjunta", active=True)
    card = Card(
        id=TRANSACTION_ID,
        name="Cartão principal",
        active=True,
        linked_account_id=ACCOUNT_ID,
        closing_day=25,
        due_day=5,
        limit=Decimal("10000.00"),
    )
    category = Category(name="Alimentação", active=True)
    budget = Budget(
        id=GROUP_ID,
        competence="2026-09",
        category="Alimentação",
        budgeted_amount=Decimal("1200.00"),
        active=True,
    )

    assert account.initial_balance == Decimal("0")
    assert card.limit == Decimal("10000.00")
    assert category.transaction_type is None
    assert budget.competence == "2026-09"


def test_bank_transaction_and_reconciliation_states_are_explicit() -> None:
    """Extratos suportam valor com sinal, mas matching exige estado coerente."""
    bank_transaction = BankTransaction(
        bank_transaction_id="ofx-123",
        transaction_date=date(2026, 9, 17),
        amount=Decimal("-87.50"),
        description="POSTO IPIRANGA",
    )
    result = ReconciliationResult(
        bank_transaction_id="ofx-123",
        status=MatchStatus.MATCHED,
        matched_transaction_id=TRANSACTION_ID,
        score=Decimal("0.98"),
        reasons=("valor e data coincidem",),
    )

    assert bank_transaction.amount == Decimal("-87.50")
    assert result.matched_transaction_id == TRANSACTION_ID

    with pytest.raises(ValidationError):
        ReconciliationResult(bank_transaction_id="ofx-123", status=MatchStatus.MATCHED)

    with pytest.raises(ValidationError):
        ReconciliationResult(
            bank_transaction_id="ofx-123",
            status=MatchStatus.NEW,
            matched_transaction_id=TRANSACTION_ID,
        )
