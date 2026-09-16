import assert from "node:assert/strict";
import test from "node:test";

const { filterTransactions } = await import("../lib/transactions.ts");

const transactions = [
  { date: "2026-09-16", time: "18:00", type: "expense", category: "Mercado", description: "Compras", amount: 100, account: "Conta A", paymentMethod: "Cartão", installment: "", originalText: "supermercado semanal" },
  { date: "2026-09-02", time: "09:00", type: "income", category: "Salário", description: "Pagamento", amount: 1000, account: "Conta A", paymentMethod: "Transferência", installment: "", originalText: "receita mensal" },
  { date: "2026-08-20", time: "12:00", type: "expense", category: "Lazer", description: "Cinema", amount: 50, account: "Conta B", paymentMethod: "Débito", installment: "", originalText: "filme" },
  { date: "2026-01-10", time: "10:00", type: "expense", category: "Mercado", description: "Feira", amount: 30, account: "Conta A", paymentMethod: "Pix", installment: "", originalText: "hortifruti" },
  { date: "2025-12-31", time: "23:00", type: "expense", category: "Lazer", description: "Festa", amount: 80, account: "Conta B", paymentMethod: "Cartão", installment: "", originalText: "ano novo" },
];

const today = new Date(2026, 8, 16, 12);
const defaults = { period: "thisMonth", type: "all", category: "all", account: "all", query: "", startDate: "", endDate: "" };

test("filtra este mês, mês passado e este ano", () => {
  assert.deepEqual(filterTransactions(transactions, defaults, today).map((item) => item.date), ["2026-09-16", "2026-09-02"]);
  assert.deepEqual(filterTransactions(transactions, { ...defaults, period: "lastMonth" }, today).map((item) => item.date), ["2026-08-20"]);
  assert.deepEqual(filterTransactions(transactions, { ...defaults, period: "thisYear" }, today).map((item) => item.date), ["2026-09-16", "2026-09-02", "2026-08-20", "2026-01-10"]);
});

test("filtra intervalo personalizado de forma inclusiva", () => {
  const result = filterTransactions(transactions, {
    ...defaults,
    period: "custom",
    startDate: "2026-08-20",
    endDate: "2026-09-02",
  }, today);

  assert.deepEqual(result.map((item) => item.date), ["2026-09-02", "2026-08-20"]);
});

test("combina filtros de tipo, categoria, conta e busca textual sem diferenciar maiúsculas", () => {
  const result = filterTransactions(transactions, {
    ...defaults,
    type: "expense",
    category: "Mercado",
    account: "Conta A",
    query: "SuPeRmErCaDo",
  }, today);

  assert.deepEqual(result.map((item) => item.description), ["Compras"]);
});

test("busca por descrição, categoria e texto original", () => {
  assert.deepEqual(filterTransactions(transactions, { ...defaults, query: "PAGAMENTO" }, today).map((item) => item.description), ["Pagamento"]);
  assert.deepEqual(filterTransactions(transactions, { ...defaults, query: "mercado" }, today).map((item) => item.description), ["Compras"]);
  assert.deepEqual(filterTransactions(transactions, { ...defaults, query: "SEMANAL" }, today).map((item) => item.description), ["Compras"]);
});
