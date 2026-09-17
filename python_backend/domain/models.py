"""Modelos validados para regras financeiras e integrações futuras."""

from datetime import date, time
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator

from .enums import (
    InstallmentStatus,
    MatchStatus,
    PaymentMethod,
    TransactionOrigin,
    TransactionType,
)

PositiveMoney = Annotated[
    Decimal,
    Field(strict=True, gt=Decimal("0"), allow_inf_nan=False),
]


def validate_nonzero_money(value: Decimal) -> Decimal:
    """Rejeita zero sem relaxar o tipo Decimal exigido pelo domínio."""
    if value == Decimal("0"):
        raise ValueError("O valor monetário não pode ser zero.")
    return value


NonZeroMoney = Annotated[
    Decimal,
    Field(strict=True, allow_inf_nan=False),
    AfterValidator(validate_nonzero_money),
]
Competence = Annotated[str, Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")]


class DomainModel(BaseModel):
    """Configuração comum para modelos internos do domínio."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, validate_assignment=True)


class Transaction(DomainModel):
    """Movimentação financeira normalizada antes de ser processada."""

    id: UUID | None = None
    transaction_date: date = Field(strict=True)
    transaction_time: time | None = Field(default=None, strict=True)
    transaction_type: TransactionType
    category: str = Field(min_length=1)
    description: str = Field(min_length=1)
    amount: PositiveMoney
    account: str | None = None
    payment_method: PaymentMethod | None = None
    installments: int = Field(default=1, ge=1)
    original_text: str | None = None
    origin: TransactionOrigin | None = None
    processed: bool = False


class Installment(DomainModel):
    """Parcela individual vinculada a uma movimentação original."""

    id: UUID
    installment_group_id: UUID
    transaction_id: UUID
    description: str = Field(min_length=1)
    total_amount: PositiveMoney
    installment_number: int = Field(ge=1)
    installments_total: int = Field(ge=1)
    installment_amount: PositiveMoney
    competence: Competence
    due_date: date = Field(strict=True)
    status: InstallmentStatus = InstallmentStatus.PENDING
    paid_at: date | None = Field(default=None, strict=True)
    account: str | None = None
    card: str | None = None

    @model_validator(mode="after")
    def validate_installment(self) -> "Installment":
        """Impede números de parcela e estados de pagamento incoerentes."""
        if self.installment_number > self.installments_total:
            raise ValueError("O número da parcela não pode exceder o total de parcelas.")
        if self.status is InstallmentStatus.PAID and self.paid_at is None:
            raise ValueError("Uma parcela paga deve possuir data de pagamento.")
        if self.status is not InstallmentStatus.PAID and self.paid_at is not None:
            raise ValueError("Somente uma parcela paga pode possuir data de pagamento.")
        return self


class RecurringTransaction(DomainModel):
    """Definição de uma movimentação recorrente agendada."""

    id: UUID
    active: bool
    description: str = Field(min_length=1)
    transaction_type: TransactionType
    category: str = Field(min_length=1)
    subcategory: str | None = None
    amount: PositiveMoney
    day: int = Field(ge=1, le=31)
    account: str | None = None
    payment_method: PaymentMethod | None = None
    start_date: date = Field(strict=True)
    end_date: date | None = Field(default=None, strict=True)
    last_posted_at: date | None = Field(default=None, strict=True)

    @model_validator(mode="after")
    def validate_date_range(self) -> "RecurringTransaction":
        """Não permite que a recorrência termine antes de começar."""
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("A data final não pode ser anterior à data inicial.")
        return self


class Account(DomainModel):
    """Conta financeira cadastrada na planilha."""

    id: UUID
    name: str = Field(min_length=1)
    active: bool
    institution: str | None = None
    account_type: str | None = None
    initial_balance: Decimal = Field(default=Decimal("0"), strict=True, allow_inf_nan=False)
    notes: str | None = None


class Card(DomainModel):
    """Cartão de crédito e suas datas de ciclo."""

    id: UUID
    name: str = Field(min_length=1)
    active: bool
    linked_account_id: UUID | None = None
    closing_day: int = Field(ge=1, le=31)
    due_day: int = Field(ge=1, le=31)
    limit: Decimal | None = Field(default=None, strict=True, ge=Decimal("0"), allow_inf_nan=False)
    brand: str | None = None
    notes: str | None = None


class Category(DomainModel):
    """Categoria ativa ou inativa vinda da aba Categorias."""

    name: str = Field(min_length=1)
    subcategory: str | None = None
    transaction_type: TransactionType | None = None
    active: bool


class Budget(DomainModel):
    """Limite financeiro por competência e categoria."""

    # A estrutura V1 da aba Orçamentos não possui uma coluna de ID.
    id: UUID | None = None
    competence: Competence
    category: str = Field(min_length=1)
    subcategory: str | None = None
    budgeted_amount: PositiveMoney
    active: bool
    notes: str | None = None


class BankTransaction(DomainModel):
    """Lançamento normalizado de um arquivo bancário, antes do matching."""

    bank_transaction_id: str | None = None
    transaction_date: date = Field(strict=True)
    amount: NonZeroMoney
    description: str = Field(min_length=1)
    transaction_type: TransactionType | None = None
    account: str | None = None
    card: str | None = None
    raw_reference: str | None = None


class ReconciliationResult(DomainModel):
    """Resultado explicável do matching de uma transação bancária."""

    bank_transaction_id: str = Field(min_length=1)
    status: MatchStatus
    matched_transaction_id: UUID | None = None
    score: Decimal | None = Field(
        default=None,
        strict=True,
        ge=Decimal("0"),
        le=Decimal("1"),
        allow_inf_nan=False,
    )
    reasons: tuple[str, ...] = ()

    @model_validator(mode="after")
    def validate_match_state(self) -> "ReconciliationResult":
        """Mantém o resultado de matching coerente com seu estado."""
        if self.status is MatchStatus.MATCHED and self.matched_transaction_id is None:
            raise ValueError("Um resultado MATCHED exige uma movimentação correspondente.")
        if self.status is MatchStatus.NEW and self.matched_transaction_id is not None:
            raise ValueError("Um resultado NEW não pode apontar para uma movimentação existente.")
        return self
