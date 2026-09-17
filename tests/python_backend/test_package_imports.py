"""Smoke tests da estrutura base do backend Python."""

import importlib

import pytest


@pytest.mark.parametrize(
    "module_name",
    [
        "python_backend",
        "python_backend.domain",
        "python_backend.repositories",
        "python_backend.services",
        "python_backend.bank_import",
        "python_backend.bank_import.parsers",
        "python_backend.utils",
    ],
)
def test_backend_packages_import(module_name: str) -> None:
    """Cada pacote da Fase 1 deve poder ser importado isoladamente."""
    assert importlib.import_module(module_name)

