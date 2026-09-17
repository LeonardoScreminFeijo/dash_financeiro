"""Operações monetárias determinísticas baseadas em :class:`Decimal`."""

import math
import re
from collections.abc import Iterable
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

CENT = Decimal("0.01")
MoneyInput = Decimal | int | float | str


class MoneyValidationError(ValueError):
    """Indica um valor monetário ausente, inválido ou fora do contexto esperado."""


def parse_money(value: MoneyInput) -> Decimal:
    """Converte valores comuns do Sheets e textos pt-BR em ``Decimal`` sem arredondar.

    O suporte a ``float`` existe apenas na fronteira de dados do Sheets e usa sua
    representação textual. Cálculos internos devem receber ``Decimal``.
    """
    if isinstance(value, bool):
        raise MoneyValidationError("Booleanos não são valores monetários válidos.")
    if isinstance(value, Decimal):
        parsed = value
    elif isinstance(value, int):
        parsed = Decimal(value)
    elif isinstance(value, float):
        if not math.isfinite(value):
            raise MoneyValidationError("O valor monetário precisa ser finito.")
        parsed = Decimal(str(value))
    elif isinstance(value, str):
        parsed = _parse_money_text(value)
    else:
        raise MoneyValidationError("Tipo de valor monetário não suportado.")

    if not parsed.is_finite():
        raise MoneyValidationError("O valor monetário precisa ser finito.")
    return parsed


def quantize_cents(value: Decimal) -> Decimal:
    """Arredonda explicitamente um ``Decimal`` para centavos usando meio para cima."""
    _require_decimal(value)
    if not value.is_finite():
        raise MoneyValidationError("O valor monetário precisa ser finito.")
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def validate_amount(value: Decimal, *, allow_zero: bool = False) -> Decimal:
    """Valida um montante finito e positivo para o contexto informado."""
    _require_decimal(value)
    if not value.is_finite():
        raise MoneyValidationError("O valor monetário precisa ser finito.")
    if value < Decimal("0") or (value == Decimal("0") and not allow_zero):
        raise MoneyValidationError("O valor monetário deve ser positivo neste contexto.")
    return value


def sum_money(values: Iterable[Decimal]) -> Decimal:
    """Soma valores ``Decimal`` sem permitir números de ponto flutuante."""
    total = Decimal("0")
    for value in values:
        _require_decimal(value)
        if not value.is_finite():
            raise MoneyValidationError("O valor monetário precisa ser finito.")
        total += value
    return total


def split_installments(total: Decimal, installments: int) -> list[Decimal]:
    """Divide um total em parcelas de centavos cuja soma é exatamente o total.

    Os centavos restantes são distribuídos para as primeiras parcelas: por
    exemplo, ``100.00`` em três vezes gera ``33.34, 33.33, 33.33``.
    """
    validate_amount(total)
    if total != quantize_cents(total):
        raise MoneyValidationError("O total deve estar quantizado em centavos antes da divisão.")
    if isinstance(installments, bool) or not isinstance(installments, int) or installments < 1:
        raise MoneyValidationError("A quantidade de parcelas deve ser um inteiro positivo.")

    total_cents = int(total / CENT)
    base_cents, extra_cents = divmod(total_cents, installments)
    return [
        Decimal(base_cents + (1 if installment_index < extra_cents else 0)) * CENT
        for installment_index in range(installments)
    ]


def _parse_money_text(value: str) -> Decimal:
    """Normaliza texto brasileiro ou decimal com ponto para uma representação Decimal."""
    normalized = value.strip().replace("\u00a0", "")
    normalized = re.sub(r"(?i)^r\$\s*", "", normalized)
    if normalized.startswith("(") and normalized.endswith(")"):
        normalized = f"-{normalized[1:-1]}"
    normalized = normalized.replace(" ", "")
    if not normalized:
        raise MoneyValidationError("O valor monetário não pode estar vazio.")

    comma_index = normalized.rfind(",")
    dot_index = normalized.rfind(".")
    if comma_index >= 0 and dot_index >= 0:
        decimal_separator = "," if comma_index > dot_index else "."
        thousands_separator = "." if decimal_separator == "," else ","
        normalized = normalized.replace(thousands_separator, "").replace(decimal_separator, ".")
    elif comma_index >= 0:
        if normalized.count(",") != 1:
            raise MoneyValidationError("Formato monetário inválido.")
        normalized = normalized.replace(",", ".")
    elif normalized.count(".") > 1:
        raise MoneyValidationError("Formato monetário inválido.")

    try:
        return Decimal(normalized)
    except InvalidOperation as error:
        raise MoneyValidationError("Formato monetário inválido.") from error


def _require_decimal(value: Decimal) -> None:
    """Impede que cálculos internos recebam ``float`` ou outro tipo numérico."""
    if not isinstance(value, Decimal):
        raise MoneyValidationError("Cálculos monetários exigem Decimal.")
