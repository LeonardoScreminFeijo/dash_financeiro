"""Testes das regras de data e timezone financeiro."""

from datetime import UTC, date, datetime

import pytest

from python_backend.utils.dates import (
    DateValidationError,
    add_months,
    competence_for,
    financial_date_in_sao_paulo,
    format_iso_date,
    last_day_of_month,
    now_in_sao_paulo,
    parse_brazilian_date,
    parse_iso_date,
    parse_sheet_date,
)


def test_parse_sheet_date_supports_date_datetime_text_and_serial() -> None:
    """A fronteira aceita os formatos documentados sem alterar datas de parede."""
    assert parse_sheet_date(date(2026, 9, 17)) == date(2026, 9, 17)
    assert parse_sheet_date(datetime(2026, 9, 17, 23, 59)) == date(2026, 9, 17)
    assert parse_sheet_date("2026-09-17") == date(2026, 9, 17)
    assert parse_sheet_date("17/09/2026") == date(2026, 9, 17)
    assert parse_sheet_date(2) == date(1900, 1, 1)


def test_iso_and_brazilian_date_parsers_are_strict() -> None:
    """Formatos vagos ou impossíveis não entram no domínio."""
    assert parse_iso_date("2026-02-28") == date(2026, 2, 28)
    assert parse_brazilian_date("29/02/2024") == date(2024, 2, 29)

    for value in ("2026/09/17", "17-09-2026", "2026-02-29", "", "17/09/2026 10:00"):
        with pytest.raises(DateValidationError):
            parse_sheet_date(value)


def test_format_and_competence_do_not_shift_calendar_date() -> None:
    """Datas já financeiras são serializadas sem conversão implícita de timezone."""
    value = date(2026, 9, 17)

    assert format_iso_date(value) == "2026-09-17"
    assert competence_for(value) == "2026-09"


def test_last_day_of_month_handles_leap_and_non_leap_february() -> None:
    """O calendário resolve fevereiro conforme o ano informado."""
    assert last_day_of_month(2026, 2) == date(2026, 2, 28)
    assert last_day_of_month(2024, 2) == date(2024, 2, 29)


@pytest.mark.parametrize(
    ("source", "months", "expected"),
    [
        (date(2026, 12, 15), 1, date(2027, 1, 15)),
        (date(2026, 1, 31), 1, date(2026, 2, 28)),
        (date(2024, 1, 31), 1, date(2024, 2, 29)),
        (date(2026, 3, 31), -1, date(2026, 2, 28)),
    ],
)
def test_add_months_safely_handles_year_boundaries_and_short_months(
    source: date,
    months: int,
    expected: date,
) -> None:
    """Dias 29, 30 e 31 são limitados ao último dia disponível."""
    assert add_months(source, months) == expected


def test_timezone_conversion_uses_sao_paulo_for_financial_day() -> None:
    """Um instante UTC próximo da meia-noite pode pertencer ao dia anterior no Brasil."""
    utc_instant = datetime(2026, 9, 17, 2, 30, tzinfo=UTC)

    localized = now_in_sao_paulo(utc_instant)

    assert localized.date() == date(2026, 9, 16)
    assert financial_date_in_sao_paulo(utc_instant) == date(2026, 9, 16)


def test_timezone_helpers_reject_naive_datetime() -> None:
    """O backend não assume UTC para instantes sem timezone."""
    naive = datetime(2026, 9, 17, 10, 0)

    with pytest.raises(DateValidationError):
        now_in_sao_paulo(naive)

    with pytest.raises(DateValidationError):
        financial_date_in_sao_paulo(naive)


@pytest.mark.parametrize("value", [True, 0, float("inf")])
def test_sheet_date_rejects_invalid_serials(value: bool | float | int) -> None:
    """Seriais inválidos não podem produzir datas financeiras válidas."""
    with pytest.raises(DateValidationError):
        parse_sheet_date(value)
