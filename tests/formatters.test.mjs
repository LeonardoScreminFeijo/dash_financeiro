import assert from "node:assert/strict";
import test from "node:test";

const {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatPercentage,
  formatShortDate,
} = await import("../lib/formatters.ts");

test("formata moeda em BRL para pt-BR", () => {
  assert.equal(formatCurrency(1234.56), "R$ 1.234,56");
  assert.equal(formatCurrency(-12.5), "-R$ 12,50");
});

test("usa fallback seguro para valores monetários inválidos", () => {
  assert.equal(formatCurrency(Number.NaN), "—");
  assert.equal(formatCurrency(Number.POSITIVE_INFINITY), "—");
});

test("formata data ISO sem deslocamento de fuso", () => {
  assert.equal(formatDate("2026-09-16"), "16/09/2026");
  assert.equal(formatShortDate("2026-09-16"), "16/09");
});

test("usa fallback seguro para datas ausentes ou inválidas", () => {
  assert.equal(formatDate(""), "—");
  assert.equal(formatDate("2026-02-30"), "—");
  assert.equal(formatDate("16/09/2026"), "—");
});

test("formata percentuais e valores compactos em pt-BR", () => {
  assert.equal(formatPercentage(17.86), "17,9%");
  assert.equal(formatPercentage(0), "0%");
  assert.match(formatCompactCurrency(12500), /^R\$\s?12,5\s?mil$/);
});
