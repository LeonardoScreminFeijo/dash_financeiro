import assert from "node:assert/strict";
import test from "node:test";

const {
  getAverageDailyExpense,
  getBalance,
  getCumulativeDailyExpenses,
  getDailyExpenses,
  getGroupedExpenses,
  getIncomeCommittedPercentage,
  getInstallments,
  getLargestExpenseCategory,
  getTotalExpenses,
  getTotalIncome,
} = await import("../lib/finance.ts");

const transactions = [
  { date: "2026-09-01", time: "08:00", type: "income", category: "Salário", description: "Salário", amount: 1000, account: "Conta A", paymentMethod: "Transferência", installment: "", originalText: "" },
  { date: "2026-09-02", time: "12:00", type: "income", category: "Extra", description: "Freelance", amount: 200, account: "Conta A", paymentMethod: "Transferência", installment: "", originalText: "" },
  { date: "2026-09-01", time: "10:00", type: "expense", category: "Mercado", description: "Compras", amount: 100, account: "Conta A", paymentMethod: "Cartão", installment: "1x", originalText: "" },
  { date: "2026-09-01", time: "18:00", type: "expense", category: "Transporte", description: "Combustível", amount: 50, account: "Conta B", paymentMethod: "Débito", installment: "", originalText: "" },
  { date: "2026-09-02", time: "15:00", type: "expense", category: "Mercado", description: "Eletrodoméstico", amount: 25, account: "Conta A", paymentMethod: "Cartão", installment: "3x", originalText: "" },
  { date: "2026-09-03", time: "09:00", type: "expense", category: "Lazer", description: "Viagem", amount: 40, account: "Conta B", paymentMethod: "Cartão", installment: "10/12", originalText: "" },
];

test("calcula receitas, despesas, saldo e renda comprometida", () => {
  assert.equal(getTotalIncome(transactions), 1200);
  assert.equal(getTotalExpenses(transactions), 215);
  assert.equal(getBalance(transactions), 985);
  assert.equal(getIncomeCommittedPercentage(transactions), (215 / 1200) * 100);
  assert.equal(getIncomeCommittedPercentage(transactions.filter((item) => item.type === "expense")), 0);
});

test("agrupa despesas por categoria, conta e pagamento em ordem decrescente", () => {
  assert.deepEqual(getGroupedExpenses(transactions, "category"), [
    { label: "Mercado", value: 125 },
    { label: "Transporte", value: 50 },
    { label: "Lazer", value: 40 },
  ]);
  assert.deepEqual(getGroupedExpenses(transactions, "account"), [
    { label: "Conta A", value: 125 },
    { label: "Conta B", value: 90 },
  ]);
  assert.deepEqual(getGroupedExpenses(transactions, "paymentMethod"), [
    { label: "Cartão", value: 165 },
    { label: "Débito", value: 50 },
  ]);
});

test("calcula evolução e média diária de despesas pelos dias com gastos", () => {
  assert.deepEqual(getDailyExpenses(transactions), [
    { date: "2026-09-01", value: 150 },
    { date: "2026-09-02", value: 25 },
    { date: "2026-09-03", value: 40 },
  ]);
  assert.equal(getAverageDailyExpense(transactions), 215 / 3);
  assert.deepEqual(getCumulativeDailyExpenses(transactions), [
    { date: "2026-09-01", value: 150 },
    { date: "2026-09-02", value: 175 },
    { date: "2026-09-03", value: 215 },
  ]);
});

test("identifica a maior categoria e somente compras parceladas acima de uma parcela", () => {
  assert.deepEqual(getLargestExpenseCategory(transactions), { label: "Mercado", value: 125 });
  const firstOfTwelveInstallments = {
    date: "2026-09-04",
    time: "10:00",
    type: "expense",
    category: "Tecnologia",
    description: "Celular",
    amount: 100,
    account: "Conta A",
    paymentMethod: "Cartão",
    installment: "1/12",
    originalText: "",
  };
  const numericInstallments = {
    ...firstOfTwelveInstallments,
    description: "Máquina de lavar",
    installment: "6",
  };

  assert.deepEqual(
    getInstallments([...transactions, firstOfTwelveInstallments, numericInstallments]).map((item) => item.description),
    ["Eletrodoméstico", "Viagem", "Celular", "Máquina de lavar"],
  );
});
