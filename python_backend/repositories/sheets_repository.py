"""Adaptador Google Sheets: I/O em lote, sem regras financeiras de domínio."""

from __future__ import annotations

import json
import os
from collections.abc import Callable, Iterable, Sequence
from datetime import date, time
from decimal import Decimal
from typing import Protocol, cast
from uuid import UUID

from pydantic import ValidationError

from python_backend.domain import (
    Account,
    Budget,
    Card,
    Category,
    Installment,
    InstallmentStatus,
    PaymentMethod,
    RecurringTransaction,
    Transaction,
    TransactionOrigin,
    TransactionType,
)
from python_backend.utils.dates import DateValidationError, parse_sheet_date
from python_backend.utils.money import MoneyValidationError, parse_money, quantize_cents

GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets"
BACKUP_SHEET = "Movimentações Backup 2026-09-17"
SHEET_RANGES = {
    "Movimentações": "Movimentações!A1:M",
    "Parcelamentos": "Parcelamentos!A1:M",
    "Recorrentes": "Recorrentes!A1:L",
    "Contas": "Contas!A1:G",
    "Cartões": "Cartões!A1:I",
    "Categorias": "Categorias!A1:D",
    "Orçamentos": "Orçamentos!A1:F",
}


class SheetsRepositoryError(RuntimeError):
    """Erro seguro da fronteira com Google Sheets."""


class SheetsConfigurationError(SheetsRepositoryError):
    pass


class SheetNotFoundError(SheetsRepositoryError):
    pass


class SheetPermissionError(SheetsRepositoryError):
    pass


class SheetTimeoutError(SheetsRepositoryError):
    pass


class InvalidSheetRowError(SheetsRepositoryError):
    pass


class ProtectedSheetWriteError(SheetsRepositoryError):
    pass


class ExecutableRequest(Protocol):
    def execute(self) -> object: ...


class ValuesResource(Protocol):
    def get(self, *, spreadsheetId: str, range: str, majorDimension: str) -> ExecutableRequest: ...
    def batchGet(
        self, *, spreadsheetId: str, ranges: list[str], majorDimension: str
    ) -> ExecutableRequest: ...
    def append(
        self,
        *,
        spreadsheetId: str,
        range: str,
        valueInputOption: str,
        insertDataOption: str,
        body: dict[str, object],
    ) -> ExecutableRequest: ...
    def batchUpdate(self, *, spreadsheetId: str, body: dict[str, object]) -> ExecutableRequest: ...


class SpreadsheetsResource(Protocol):
    def values(self) -> ValuesResource: ...


class SheetsService(Protocol):
    def spreadsheets(self) -> SpreadsheetsResource: ...


Row = dict[str, str]


class GoogleSheetsRepository:
    """Repositório da V1 para as abas operacionais, com ranges limitados e batch I/O."""

    def __init__(self, service: SheetsService, spreadsheet_id: str) -> None:
        if not spreadsheet_id.strip():
            raise SheetsConfigurationError("GOOGLE_SPREADSHEET_ID não foi configurado.")
        self._service = service
        self._spreadsheet_id = spreadsheet_id

    @classmethod
    def from_environment(cls) -> GoogleSheetsRepository:
        spreadsheet_id = os.getenv("GOOGLE_SPREADSHEET_ID", "").strip()
        raw_credentials = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
        if not spreadsheet_id or not raw_credentials:
            raise SheetsConfigurationError("Credenciais do Google Sheets não foram configuradas.")
        try:
            service_account_info = json.loads(raw_credentials)
            if not isinstance(service_account_info, dict):
                raise ValueError
            from google.oauth2.service_account import Credentials
            from googleapiclient.discovery import build

            credentials = Credentials.from_service_account_info(  # type: ignore[no-untyped-call]
                service_account_info, scopes=[GOOGLE_SHEETS_SCOPE]
            )
            service = cast(
                SheetsService, build("sheets", "v4", credentials=credentials, cache_discovery=False)
            )
        except (ValueError, TypeError, KeyError) as error:
            raise SheetsConfigurationError("GOOGLE_SERVICE_ACCOUNT_JSON é inválido.") from error
        return cls(service, spreadsheet_id)

    def list_unprocessed_transactions(self) -> list[Transaction]:
        return [transaction for transaction in self._transactions() if not transaction.processed]

    def get_transaction_by_id(self, transaction_id: UUID) -> Transaction | None:
        return next((item for item in self._transactions() if item.id == transaction_id), None)

    def create_transaction(self, transaction: Transaction) -> Transaction:
        self._append("Movimentações", self._transaction_values(transaction))
        return transaction

    def update_transaction(self, transaction: Transaction) -> Transaction:
        if transaction.id is None:
            raise InvalidSheetRowError("Não é possível atualizar uma movimentação sem ID.")
        row_number = self._transaction_row_number(transaction.id)
        self._batch_write(
            "Movimentações",
            [(f"A{row_number}:M{row_number}", self._transaction_values(transaction))],
        )
        return transaction

    def mark_transaction_processed(self, transaction_id: UUID) -> None:
        row_number = self._transaction_row_number(transaction_id)
        self._batch_write("Movimentações", [(f"M{row_number}", ["TRUE"])])

    def list_installments(self, transaction_id: UUID | None = None) -> list[Installment]:
        installments = [self._installment(row, line) for line, row in self._read("Parcelamentos")]
        return [
            item
            for item in installments
            if transaction_id is None or item.transaction_id == transaction_id
        ]

    def create_installments(self, installments: list[Installment]) -> list[Installment]:
        for installment in installments:
            self._append("Parcelamentos", self._installment_values(installment))
        return installments

    def list_recurring(self) -> list[RecurringTransaction]:
        return [self._recurring(row, line) for line, row in self._read("Recorrentes")]

    def update_recurring(self, recurring: RecurringTransaction) -> RecurringTransaction:
        row_number = self._row_number("Recorrentes", recurring.id, "Recorrente ID")
        self._batch_write(
            "Recorrentes", [(f"A{row_number}:L{row_number}", self._recurring_values(recurring))]
        )
        return recurring

    def list_accounts(self) -> list[Account]:
        return [self._account(row, line) for line, row in self._read("Contas")]

    def list_cards(self) -> list[Card]:
        return [self._card(row, line) for line, row in self._read("Cartões")]

    def list_categories(self) -> list[Category]:
        return [self._category(row, line) for line, row in self._read("Categorias")]

    def list_budgets(self) -> list[Budget]:
        return [self._budget(row, line) for line, row in self._read("Orçamentos")]

    def read_tabs(self, sheets: Sequence[str]) -> dict[str, list[Row]]:
        """Lê várias abas numa única chamada batchGet."""
        invalid = [sheet for sheet in sheets if sheet not in SHEET_RANGES]
        if invalid:
            raise SheetNotFoundError("Aba não suportada pelo repositório.")
        response = self._execute(
            lambda: (
                self._service.spreadsheets()
                .values()
                .batchGet(
                    spreadsheetId=self._spreadsheet_id,
                    ranges=[SHEET_RANGES[sheet] for sheet in sheets],
                    majorDimension="ROWS",
                )
            )
        )
        if not isinstance(response, dict):
            raise SheetsRepositoryError("Resposta inválida do Google Sheets.")
        value_ranges = response.get("valueRanges")
        if not isinstance(value_ranges, list):
            raise SheetsRepositoryError("Resposta inválida do Google Sheets.")
        return {
            sheet: self._rows_from_response(value_ranges[index], sheet)
            for index, sheet in enumerate(sheets)
        }

    def _read(self, sheet: str) -> list[tuple[int, Row]]:
        response = self._execute(
            lambda: (
                self._service.spreadsheets()
                .values()
                .get(
                    spreadsheetId=self._spreadsheet_id,
                    range=SHEET_RANGES[sheet],
                    majorDimension="ROWS",
                )
            )
        )
        rows = self._rows_from_response(response, sheet)
        return [(index + 2, row) for index, row in enumerate(rows)]

    def _rows_from_response(self, response: object, sheet: str) -> list[Row]:
        if not isinstance(response, dict):
            raise SheetsRepositoryError("Resposta inválida do Google Sheets.")
        values = response.get("values", [])
        if not isinstance(values, list) or not values:
            return []
        header_values = values[0]
        if not isinstance(header_values, list):
            raise InvalidSheetRowError(f"Cabeçalho inválido na aba {sheet}.")
        headers = [str(value).strip() for value in header_values]
        return [
            {
                headers[column]: str(value).strip()
                for column, value in enumerate(row)
                if column < len(headers)
            }
            for row in values[1:]
            if isinstance(row, list) and any(str(value).strip() for value in row)
        ]

    def _append(self, sheet: str, values: list[str]) -> None:
        self._assert_writable(sheet)
        self._execute(
            lambda: (
                self._service.spreadsheets()
                .values()
                .append(
                    spreadsheetId=self._spreadsheet_id,
                    range=f"{sheet}!A:M",
                    valueInputOption="USER_ENTERED",
                    insertDataOption="INSERT_ROWS",
                    body={"values": [values]},
                )
            )
        )

    def _batch_write(self, sheet: str, rows: Iterable[tuple[str, list[str]]]) -> None:
        self._assert_writable(sheet)
        data = [
            {"range": f"{sheet}!{cell_range}", "values": [values]} for cell_range, values in rows
        ]
        if not data:
            return
        self._execute(
            lambda: (
                self._service.spreadsheets()
                .values()
                .batchUpdate(
                    spreadsheetId=self._spreadsheet_id,
                    body={"valueInputOption": "USER_ENTERED", "data": data},
                )
            )
        )

    @staticmethod
    def _assert_writable(sheet: str) -> None:
        if sheet == BACKUP_SHEET:
            raise ProtectedSheetWriteError("A aba de backup nunca pode receber escrita.")

    def _execute(self, request: Callable[[], ExecutableRequest]) -> object:
        try:
            return request().execute()
        except TimeoutError as error:
            raise SheetTimeoutError(
                "A operação com Google Sheets excedeu o tempo limite."
            ) from error
        except Exception as error:
            status = getattr(getattr(error, "resp", None), "status", None)
            if status in {401, 403}:
                raise SheetPermissionError(
                    "A conta de serviço não possui acesso à planilha."
                ) from error
            if status == 404:
                raise SheetNotFoundError(
                    "A planilha ou a aba solicitada não foi encontrada."
                ) from error
            raise SheetsRepositoryError("Falha ao comunicar com Google Sheets.") from error

    def _transactions(self) -> list[Transaction]:
        return [self._transaction(row, line) for line, row in self._read("Movimentações")]

    def _transaction_row_number(self, transaction_id: UUID) -> int:
        return self._row_number("Movimentações", transaction_id, "ID")

    def _row_number(self, sheet: str, entity_id: UUID, id_column: str) -> int:
        for line, row in self._read(sheet):
            if row.get(id_column) == str(entity_id):
                return line
        raise SheetNotFoundError("Registro não encontrado na planilha.")

    def _transaction(self, row: Row, line: int) -> Transaction:
        return self._model(
            "Movimentações",
            line,
            lambda: Transaction(
                id=self._uuid(row.get("ID")),
                transaction_date=parse_sheet_date(self._required(row, "Data")),
                transaction_time=self._time(row.get("Hora")),
                transaction_type=TransactionType(self._required(row, "Tipo")),
                category=self._required(row, "Categoria"),
                description=self._required(row, "Descrição"),
                amount=self._money(row, "Valor"),
                account=self._text(row.get("Conta")),
                payment_method=self._enum(PaymentMethod, row.get("Pagamento")),
                installments=self._installments(row.get("Parcelas")),
                original_text=self._text(row.get("Texto Original")),
                origin=self._enum(TransactionOrigin, row.get("Origem")),
                processed=self._bool(row.get("Processado"), False),
            ),
        )

    def _installment(self, row: Row, line: int) -> Installment:
        return self._model(
            "Parcelamentos",
            line,
            lambda: Installment(
                id=self._required_uuid(row, "Parcelamento ID"),
                installment_group_id=self._required_uuid(row, "Parcelamento ID"),
                transaction_id=self._required_uuid(row, "Movimentação ID"),
                description=self._required(row, "Descrição"),
                total_amount=self._money(row, "Valor Total"),
                installment_number=int(self._required(row, "Parcela Atual")),
                installments_total=int(self._required(row, "Parcelas Total")),
                installment_amount=self._money(row, "Valor Parcela"),
                competence=self._required(row, "Competência"),
                due_date=parse_sheet_date(self._required(row, "Vencimento")),
                status=InstallmentStatus(self._required(row, "Status")),
                paid_at=self._date(row.get("Data Pagamento")),
                account=self._text(row.get("Conta")),
                card=self._text(row.get("Cartão")),
            ),
        )

    def _recurring(self, row: Row, line: int) -> RecurringTransaction:
        return self._model(
            "Recorrentes",
            line,
            lambda: RecurringTransaction(
                id=self._required_uuid(row, "Recorrente ID"),
                active=self._bool(row.get("Ativo"), True),
                description=self._required(row, "Descrição"),
                transaction_type=TransactionType(self._required(row, "Tipo")),
                category=self._required(row, "Categoria"),
                subcategory=self._text(row.get("Subcategoria")),
                amount=self._money(row, "Valor"),
                day=int(self._required(row, "Dia")),
                account=self._text(row.get("Conta")),
                payment_method=self._enum(PaymentMethod, row.get("Pagamento")),
                start_date=parse_sheet_date(self._required(row, "Data Inicial")),
                end_date=self._date(row.get("Data Final")),
                last_posted_at=self._date(row.get("Último Lançamento")),
            ),
        )

    def _account(self, row: Row, line: int) -> Account:
        return self._model(
            "Contas",
            line,
            lambda: Account(
                id=self._required_uuid(row, "Conta ID"),
                name=self._required(row, "Nome"),
                active=self._bool(row.get("Ativa"), True),
                institution=self._text(row.get("Instituição")),
                account_type=self._text(row.get("Tipo")),
                initial_balance=self._money_or_zero(row.get("Saldo Inicial")),
                notes=self._text(row.get("Observação")),
            ),
        )

    def _card(self, row: Row, line: int) -> Card:
        return self._model(
            "Cartões",
            line,
            lambda: Card(
                id=self._required_uuid(row, "Cartão ID"),
                name=self._required(row, "Nome"),
                active=self._bool(row.get("Ativo"), True),
                linked_account_id=self._uuid(row.get("Conta Vinculada")),
                closing_day=int(self._required(row, "Fechamento Dia")),
                due_day=int(self._required(row, "Vencimento Dia")),
                limit=self._optional_money(row.get("Limite")),
                brand=self._text(row.get("Bandeira")),
                notes=self._text(row.get("Observação")),
            ),
        )

    def _category(self, row: Row, line: int) -> Category:
        return self._model(
            "Categorias",
            line,
            lambda: Category(
                name=self._required(row, "Categoria"),
                subcategory=self._text(row.get("Subcategoria")),
                transaction_type=self._enum(TransactionType, row.get("Tipo")),
                active=self._bool(row.get("Ativa"), True),
            ),
        )

    def _budget(self, row: Row, line: int) -> Budget:
        return self._model(
            "Orçamentos",
            line,
            lambda: Budget(
                competence=self._required(row, "Competência"),
                category=self._required(row, "Categoria"),
                subcategory=self._text(row.get("Subcategoria")),
                budgeted_amount=self._money(row, "Valor Orçado"),
                active=self._bool(row.get("Ativo"), True),
                notes=self._text(row.get("Observação")),
            ),
        )

    @staticmethod
    def _model[T](sheet: str, line: int, build: Callable[[], T]) -> T:
        try:
            return build()
        except (ValidationError, ValueError, DateValidationError, MoneyValidationError) as error:
            raise InvalidSheetRowError(f"Linha {line} inválida na aba {sheet}.") from error

    @staticmethod
    def _required(row: Row, column: str) -> str:
        value = row.get(column, "").strip()
        if not value:
            raise ValueError(f"Coluna obrigatória ausente: {column}")
        return value

    def _required_uuid(self, row: Row, column: str) -> UUID:
        value = self._uuid(self._required(row, column))
        if value is None:
            raise ValueError(f"UUID ausente: {column}")
        return value

    @staticmethod
    def _uuid(value: str | None) -> UUID | None:
        return UUID(value) if value and value.strip() else None

    @staticmethod
    def _text(value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @staticmethod
    def _time(value: str | None) -> time | None:
        return time.fromisoformat(value) if value and value.strip() else None

    @staticmethod
    def _date(value: str | None) -> date | None:
        return parse_sheet_date(value) if value and value.strip() else None

    @staticmethod
    def _enum[T: PaymentMethod | TransactionOrigin | TransactionType](
        enum_type: type[PaymentMethod] | type[TransactionOrigin] | type[TransactionType],
        value: str | None,
    ) -> T | None:
        return cast(T, enum_type(value)) if value and value.strip() else None

    @staticmethod
    def _bool(value: str | None, default: bool) -> bool:
        if value is None or not value.strip():
            return default
        normalized = value.strip().casefold()
        if normalized in {"true", "verdadeiro", "sim", "1"}:
            return True
        if normalized in {"false", "falso", "não", "nao", "0"}:
            return False
        raise ValueError("Booleano inválido.")

    @staticmethod
    def _money(row: Row, column: str) -> Decimal:
        return quantize_cents(parse_money(GoogleSheetsRepository._required(row, column)))

    @staticmethod
    def _money_or_zero(value: str | None) -> Decimal:
        return (
            Decimal("0")
            if value is None or not value.strip()
            else quantize_cents(parse_money(value))
        )

    @staticmethod
    def _optional_money(value: str | None) -> Decimal | None:
        return None if value is None or not value.strip() else quantize_cents(parse_money(value))

    @staticmethod
    def _installments(value: str | None) -> int:
        normalized = (value or "1").strip().casefold().removesuffix("x")
        return int(normalized or "1")

    @staticmethod
    def _transaction_values(item: Transaction) -> list[str]:
        return [
            item.transaction_date.isoformat(),
            item.transaction_time.isoformat() if item.transaction_time else "",
            item.transaction_type.value,
            item.category,
            item.description,
            str(item.amount),
            item.account or "",
            item.payment_method.value if item.payment_method else "",
            str(item.installments),
            item.original_text or "",
            str(item.id) if item.id else "",
            item.origin.value if item.origin else "",
            "TRUE" if item.processed else "FALSE",
        ]

    @staticmethod
    def _installment_values(item: Installment) -> list[str]:
        return [
            str(item.installment_group_id),
            str(item.transaction_id),
            item.description,
            str(item.total_amount),
            str(item.installment_number),
            str(item.installments_total),
            str(item.installment_amount),
            item.competence,
            item.due_date.isoformat(),
            item.status.value,
            item.paid_at.isoformat() if item.paid_at else "",
            item.account or "",
            item.card or "",
        ]

    @staticmethod
    def _recurring_values(item: RecurringTransaction) -> list[str]:
        return [
            str(item.id),
            "TRUE" if item.active else "FALSE",
            item.description,
            item.transaction_type.value,
            item.category,
            item.subcategory or "",
            str(item.amount),
            str(item.day),
            item.account or "",
            item.payment_method.value if item.payment_method else "",
            item.start_date.isoformat(),
            item.end_date.isoformat() if item.end_date else "",
            item.last_posted_at.isoformat() if item.last_posted_at else "",
        ]
