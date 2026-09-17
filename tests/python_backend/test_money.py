"""Testes das regras monetárias puras."""

from decimal import Decimal

import pytest

from python_backend.utils.money import (
    MoneyValidationError,
    parse_money,
    quantize_cents,
    split_installments,
    sum_money,
    validate_amount,
)


@pytest.mark.parametrize(
    ("raw_value", "expected"),
    [
        (Decimal("1234.56"), Decimal("1234.56")),
        (1234, Decimal("1234")),
        (1234.56, Decimal("1234.56")),
        ("R$ 1.234,56", Decimal("1234.56")),
        ("1234.56", Decimal("1234.56")),
        ("(42,90)", Decimal("-42.90")),
    ],
)
def test_parse_money_supports_sheets_and_brazilian_values(
    raw_value: Decimal | int | float | str,
    expected: Decimal,
) -> None:
    """A fronteira aceita formatos externos sem usar float nos cálculos."""
    assert parse_money(raw_value) == expected


@pytest.mark.parametrize("raw_value", ["", "1,2,3", "NaN", float("inf"), True])
def test_parse_money_rejects_invalid_or_non_finite_values(raw_value: float | str | bool) -> None:
    """Nenhum formato inválido pode virar uma quantia financeira silenciosamente."""
    with pytest.raises(MoneyValidationError):
        parse_money(raw_value)


def test_quantize_and_sum_money_are_decimal_operations() -> None:
    """Arredondamento é explícito e soma não aceita float."""
    assert quantize_cents(Decimal("12.345")) == Decimal("12.35")
    assert sum_money([Decimal("1.10"), Decimal("2.20")]) == Decimal("3.30")

    with pytest.raises(MoneyValidationError):
        sum_money([Decimal("1.00"), 2.0])


def test_validate_amount_handles_zero_by_context() -> None:
    """Zero só é permitido quando o chamador o declara explicitamente."""
    assert validate_amount(Decimal("0"), allow_zero=True) == Decimal("0")

    with pytest.raises(MoneyValidationError):
        validate_amount(Decimal("0"))

    with pytest.raises(MoneyValidationError):
        validate_amount(Decimal("-0.01"), allow_zero=True)


@pytest.mark.parametrize(
    ("total", "count", "expected"),
    [
        (
            Decimal("100.00"),
            3,
            [Decimal("33.34"), Decimal("33.33"), Decimal("33.33")],
        ),
        (Decimal("147.67"), 2, [Decimal("73.84"), Decimal("73.83")]),
    ],
)
def test_split_installments_preserves_every_cent(
    total: Decimal,
    count: int,
    expected: list[Decimal],
) -> None:
    """A soma das parcelas deve ser exatamente igual ao total original."""
    installments = split_installments(total, count)

    assert installments == expected
    assert sum_money(installments) == total


@pytest.mark.parametrize(
    ("total", "count"),
    [
        (Decimal("0"), 1),
        (Decimal("10.001"), 2),
        (Decimal("10.00"), 0),
        (Decimal("10.00"), 1.5),
    ],
)
def test_split_installments_rejects_invalid_input(total: Decimal, count: int | float) -> None:
    """Divisão só aceita total positivo em centavos e número inteiro de parcelas."""
    with pytest.raises(MoneyValidationError):
        split_installments(total, count)
