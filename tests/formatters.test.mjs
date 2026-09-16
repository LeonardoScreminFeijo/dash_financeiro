import assert from "node:assert/strict";
import test from "node:test";

const { formatCurrency, formatDate } = await import("../lib/formatters.ts");

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
});

test("usa fallback seguro para datas ausentes ou inválidas", () => {
  assert.equal(formatDate(""), "—");
  assert.equal(formatDate("2026-02-30"), "—");
  assert.equal(formatDate("16/09/2026"), "—");
});
