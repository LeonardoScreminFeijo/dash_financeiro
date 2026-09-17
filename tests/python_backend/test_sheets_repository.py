from __future__ import annotations

from uuid import UUID

import pytest

from python_backend.repositories.sheets_repository import (
    BACKUP_SHEET,
    GoogleSheetsRepository,
    InvalidSheetRowError,
    ProtectedSheetWriteError,
    SheetPermissionError,
)


class FakeRequest:
    def __init__(self, response: object | Exception) -> None:
        self.response = response

    def execute(self) -> object:
        if isinstance(self.response, Exception):
            raise self.response
        return self.response


class FakeValues:
    def __init__(self, responses: dict[str, object]) -> None:
        self.responses = responses
        self.batch_requests: list[dict[str, object]] = []
        self.append_requests: list[dict[str, object]] = []

    def get(self, *, spreadsheetId: str, range: str, majorDimension: str) -> FakeRequest:
        return FakeRequest(self.responses[range])

    def batchGet(
        self, *, spreadsheetId: str, ranges: list[str], majorDimension: str
    ) -> FakeRequest:
        return FakeRequest({"valueRanges": [self.responses[sheet] for sheet in ranges]})

    def append(
        self,
        *,
        spreadsheetId: str,
        range: str,
        valueInputOption: str,
        insertDataOption: str,
        body: dict[str, object],
    ) -> FakeRequest:
        self.append_requests.append(body)
        return FakeRequest({})

    def batchUpdate(self, *, spreadsheetId: str, body: dict[str, object]) -> FakeRequest:
        self.batch_requests.append(body)
        return FakeRequest({})


class FakeSpreadsheets:
    def __init__(self, values: FakeValues) -> None:
        self._values = values

    def values(self) -> FakeValues:
        return self._values


class FakeSheetsService:
    def __init__(self, values: FakeValues) -> None:
        self._spreadsheets = FakeSpreadsheets(values)

    def spreadsheets(self) -> FakeSpreadsheets:
        return self._spreadsheets


def movements_response(processed: str = "FALSE") -> dict[str, object]:
    return {
        "values": [
            [
                "Data",
                "Hora",
                "Tipo",
                "Categoria",
                "Descrição",
                "Valor",
                "Conta",
                "Pagamento",
                "Parcelas",
                "Texto Original",
                "ID",
                "Origem",
                "Processado",
            ],
            [
                "2026-09-17",
                "09:30",
                "expense",
                "Mercado",
                "Feira",
                "R$ 12,34",
                "Conta",
                "Pix",
                "1",
                "comprar feira",
                "11111111-1111-1111-1111-111111111111",
                "Siri",
                processed,
            ],
        ]
    }


def repository_for(response: object) -> tuple[GoogleSheetsRepository, FakeValues]:
    values = FakeValues({"Movimentações!A1:M": response})
    return GoogleSheetsRepository(FakeSheetsService(values), "spreadsheet-id"), values


def test_reads_and_marks_unprocessed_transaction_in_one_range() -> None:
    repository, values = repository_for(movements_response())

    transactions = repository.list_unprocessed_transactions()

    assert len(transactions) == 1
    assert transactions[0].amount.as_tuple().digits == (1, 2, 3, 4)
    repository.mark_transaction_processed(UUID("11111111-1111-1111-1111-111111111111"))
    assert values.batch_requests == [
        {
            "valueInputOption": "USER_ENTERED",
            "data": [{"range": "Movimentações!M2", "values": [["TRUE"]]}],
        }
    ]


def test_reads_reference_tabs_with_a_single_batch_request() -> None:
    repository, _ = repository_for(movements_response())

    tabs = repository.read_tabs(["Movimentações"])

    assert tabs["Movimentações"][0]["Descrição"] == "Feira"


def test_rejects_invalid_sheet_rows_and_never_writes_backup() -> None:
    repository, _ = repository_for({"values": [["Data"], ["2026-09-17"]]})

    with pytest.raises(InvalidSheetRowError):
        repository.list_unprocessed_transactions()
    with pytest.raises(ProtectedSheetWriteError):
        repository._batch_write(BACKUP_SHEET, [("A1", ["proibido"])])


class PermissionFailure(Exception):
    class Response:
        status = 403

    resp = Response()


def test_maps_google_permission_failure_to_safe_error() -> None:
    repository, _ = repository_for(PermissionFailure())

    with pytest.raises(SheetPermissionError):
        repository.list_unprocessed_transactions()
