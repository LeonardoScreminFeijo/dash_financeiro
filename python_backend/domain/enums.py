"""Enumerações canônicas do domínio financeiro."""

from enum import Enum


class TransactionType(str, Enum):
    """Classificação financeira de uma movimentação."""

    EXPENSE = "expense"
    INCOME = "income"
    TRANSFER = "transfer"
    REFUND = "refund"


class PaymentMethod(str, Enum):
    """Formas de pagamento normalizadas pelo backend."""

    PIX = "Pix"
    CREDIT_CARD = "Cartão de Crédito"
    DEBIT_CARD = "Cartão de Débito"
    TRANSFER = "Transferência"
    CASH = "Dinheiro"
    BANK_SLIP = "Boleto"
    AUTO_DEBIT = "Débito Automático"
    OTHER = "Outro"


class TransactionOrigin(str, Enum):
    """Origem preservada de uma movimentação."""

    SIRI = "Siri"
    MANUAL = "Manual"
    BANK_STATEMENT = "Extrato"
    RECURRING = "Recorrente"
    TEST = "Teste"


class InstallmentStatus(str, Enum):
    """Estados persistidos de uma parcela."""

    PENDING = "Pendente"
    PAID = "Pago"
    CANCELLED = "Cancelado"


class MatchStatus(str, Enum):
    """Resultado do matching entre um extrato e uma movimentação."""

    MATCHED = "MATCHED"
    REVIEW = "REVIEW"
    NEW = "NEW"

