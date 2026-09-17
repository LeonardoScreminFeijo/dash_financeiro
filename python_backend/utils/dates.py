"""Funções de data para o domínio financeiro brasileiro."""

from calendar import monthrange
from datetime import date, datetime, timedelta
from math import isfinite
from zoneinfo import ZoneInfo

SAO_PAULO_TIMEZONE = ZoneInfo("America/Sao_Paulo")
GOOGLE_SHEETS_EPOCH = date(1899, 12, 30)
DateInput = date | datetime | float | int | str


class DateValidationError(ValueError):
    """Indica uma data ausente, inválida ou ambígua para o domínio."""


def parse_sheet_date(value: DateInput) -> date:
    """Lê uma data do Google Sheets sem deslocar seu dia calendário.

    Datas ``datetime`` do Sheets são tratadas como valores de parede (wall time),
    pois a data da planilha não deve mudar por conversão de timezone. Números
    seguem a origem serial do Google Sheets.
    """
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, bool):
        raise DateValidationError("Booleanos não são datas válidas.")
    if isinstance(value, str):
        return _parse_date_text(value)
    if isinstance(value, (int, float)):
        return _parse_google_sheets_serial(value)
    raise DateValidationError("Tipo de data não suportado.")


def parse_iso_date(value: str) -> date:
    """Converte uma data no formato estrito ``YYYY-MM-DD``."""
    return _parse_date_with_format(value, "%Y-%m-%d")


def parse_brazilian_date(value: str) -> date:
    """Converte uma data no formato estrito ``dd/MM/yyyy``."""
    return _parse_date_with_format(value, "%d/%m/%Y")


def format_iso_date(value: date) -> str:
    """Serializa uma data de domínio sem aplicar conversão de timezone."""
    if isinstance(value, datetime) or not isinstance(value, date):
        raise DateValidationError("A formatação ISO exige um objeto date.")
    return value.isoformat()


def competence_for(value: date) -> str:
    """Retorna a competência ``YYYY-MM`` da data financeira fornecida."""
    if isinstance(value, datetime) or not isinstance(value, date):
        raise DateValidationError("A competência exige um objeto date.")
    return f"{value.year:04d}-{value.month:02d}"


def last_day_of_month(year: int, month: int) -> date:
    """Retorna a data final de qualquer mês, inclusive fevereiro bissexto."""
    try:
        return date(year, month, monthrange(year, month)[1])
    except (TypeError, ValueError) as error:
        raise DateValidationError("Ano ou mês inválido.") from error


def add_months(value: date, months: int) -> date:
    """Adiciona meses preservando o dia quando possível e limitando-o ao mês final."""
    if isinstance(value, datetime) or not isinstance(value, date):
        raise DateValidationError("A adição de meses exige um objeto date.")
    if isinstance(months, bool) or not isinstance(months, int):
        raise DateValidationError("A quantidade de meses deve ser um inteiro.")

    target_month_index = value.year * 12 + value.month - 1 + months
    target_year, target_month_zero_index = divmod(target_month_index, 12)
    target_month = target_month_zero_index + 1
    target_day = min(value.day, last_day_of_month(target_year, target_month).day)
    return date(target_year, target_month, target_day)


def financial_date_in_sao_paulo(value: datetime) -> date:
    """Converte um instante timezone-aware para seu dia financeiro em São Paulo."""
    if value.tzinfo is None or value.utcoffset() is None:
        raise DateValidationError("Um datetime timezone-aware é obrigatório.")
    return value.astimezone(SAO_PAULO_TIMEZONE).date()


def now_in_sao_paulo(now: datetime | None = None) -> datetime:
    """Retorna o instante atual em ``America/Sao_Paulo`` de forma testável."""
    if now is None:
        return datetime.now(SAO_PAULO_TIMEZONE)
    if now.tzinfo is None or now.utcoffset() is None:
        raise DateValidationError("Um datetime timezone-aware é obrigatório.")
    return now.astimezone(SAO_PAULO_TIMEZONE)


def _parse_date_text(value: str) -> date:
    """Aceita somente os formatos externos documentados para o projeto."""
    normalized = value.strip()
    if not normalized:
        raise DateValidationError("A data não pode estar vazia.")
    for parser in (parse_iso_date, parse_brazilian_date):
        try:
            return parser(normalized)
        except DateValidationError:
            continue
    raise DateValidationError("Formato de data inválido. Use YYYY-MM-DD ou dd/MM/yyyy.")


def _parse_date_with_format(value: str, date_format: str) -> date:
    """Aplica um formato estrito, sem aceitar horários ou texto adicional."""
    try:
        return datetime.strptime(value, date_format).date()
    except (TypeError, ValueError) as error:
        raise DateValidationError("Formato de data inválido.") from error


def _parse_google_sheets_serial(value: int | float) -> date:
    """Converte um serial Google Sheets para data, ignorando sua fração horária."""
    if isinstance(value, float) and not isfinite(value):
        raise DateValidationError("O serial de data precisa ser finito.")
    if value < 1:
        raise DateValidationError("O serial de data precisa ser positivo.")
    try:
        return GOOGLE_SHEETS_EPOCH + timedelta(days=value)
    except OverflowError as error:
        raise DateValidationError("Serial de data fora do intervalo suportado.") from error
