import assert from "node:assert/strict";
import test from "node:test";

const { mapTransaction, normalizeTransactions } = await import("../lib/normalize.ts");

test("normaliza uma linha completa com os nomes de coluna do Apps Script", () => {
  assert.deepEqual(mapTransaction({
    Data: "2026-09-16",
    Hora: "08:30",
    Tipo: "expense",
    Categoria: "Mercado",
    "Descrição": "Compras da semana",
    Valor: "R$ 150,00",
    Conta: "Conta principal",
    Pagamento: "Cartão",
    Parcelamento: "1x",
    "Texto Original": "gastei 150 no mercado",
  }), {
    date: "2026-09-16",
    time: "08:30",
    type: "expense",
    category: "Mercado",
    description: "Compras da semana",
    amount: 150,
    account: "Conta principal",
    paymentMethod: "Cartão",
    installment: "1x",
    originalText: "gastei 150 no mercado",
  });
});

test("aplica fallbacks aos campos opcionais vazios", () => {
  const transaction = mapTransaction({ Data: "2026-09-16", Tipo: "expense", Valor: 25 });

  assert.equal(transaction.category, "Sem categoria");
  assert.equal(transaction.description, "Sem descrição");
  assert.equal(transaction.account, "Não informada");
  assert.equal(transaction.paymentMethod, "Não informado");
  assert.equal(transaction.time, "");
  assert.equal(transaction.installment, "");
  assert.equal(transaction.originalText, "");
});

test("normaliza valores numéricos e negativos para magnitude positiva", () => {
  assert.equal(mapTransaction({ Data: "2026-09-16", Valor: -1234.56 }).amount, 1234.56);
});

test("normaliza valor brasileiro em string", () => {
  assert.equal(mapTransaction({ Data: "2026-09-16", Valor: "R$ 1.234,56" }).amount, 1234.56);
});

test("normaliza valor decimal com ponto", () => {
  assert.equal(mapTransaction({ Data: "2026-09-16", Valor: "1234.56" }).amount, 1234.56);
});

test("normaliza datas ISO com horário e datas brasileiras", () => {
  assert.equal(mapTransaction({ Data: "2026-09-16T08:30:00.000Z", Valor: 1 }).date, "2026-09-16");
  assert.equal(mapTransaction({ Data: "16/09/2026", Valor: 1 }).date, "2026-09-16");
});

test("normaliza receita e income para income", () => {
  assert.equal(mapTransaction({ Data: "2026-09-16", Tipo: "receita", Valor: 1 }).type, "income");
  assert.equal(mapTransaction({ Data: "2026-09-16", Tipo: "income", Valor: 1 }).type, "income");
});

test("trata tipo desconhecido como despesa", () => {
  assert.equal(mapTransaction({ Data: "2026-09-16", Tipo: "transferência", Valor: 1 }).type, "expense");
});

test("descarta linhas com data inválida ou valor inválido e zero", () => {
  assert.deepEqual(normalizeTransactions([
    { Data: "2026-02-30", Valor: 10 },
    { Data: "2026-09-16", Valor: "inválido" },
    { Data: "2026-09-16", Valor: 0 },
  ]), []);
});
