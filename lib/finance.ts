import type { Transaction } from "@/types/transaction";

export interface ValueByLabel { label: string; value: number }
export interface DailyExpense { date: string; value: number }

export function getTotalIncome(transactions: Transaction[]): number {
  return transactions.filter((item) => item.type === "income").reduce((total, item) => total + item.amount, 0);
}

export function getTotalExpenses(transactions: Transaction[]): number {
  return transactions.filter((item) => item.type === "expense").reduce((total, item) => total + item.amount, 0);
}

export function getBalance(transactions: Transaction[]): number { return getTotalIncome(transactions) - getTotalExpenses(transactions); }

export function getIncomeCommittedPercentage(transactions: Transaction[]): number {
  const income = getTotalIncome(transactions);
  return income > 0 ? (getTotalExpenses(transactions) / income) * 100 : 0;
}

export function getGroupedExpenses(transactions: Transaction[], key: "category" | "account" | "paymentMethod"): ValueByLabel[] {
  const totals = new Map<string, number>();
  for (const item of transactions) {
    if (item.type !== "expense") continue;
    totals.set(item[key], (totals.get(item[key]) ?? 0) + item.amount);
  }
  return [...totals].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function getDailyExpenses(transactions: Transaction[]): DailyExpense[] {
  const totals = new Map<string, number>();
  for (const item of transactions) if (item.type === "expense") totals.set(item.date, (totals.get(item.date) ?? 0) + item.amount);
  return [...totals].map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
}

export function getAverageDailyExpense(transactions: Transaction[]): number {
  const daily = getDailyExpenses(transactions);
  return daily.length ? getTotalExpenses(transactions) / daily.length : 0;
}

export function getLargestExpenseCategory(transactions: Transaction[]): ValueByLabel | undefined { return getGroupedExpenses(transactions, "category")[0]; }

export function getInstallments(transactions: Transaction[]): Transaction[] {
  return transactions.filter((item) => item.type === "expense" && /^(?:[2-9]|[1-9]\d+)\s*(?:x|\/)/i.test(item.installment));
}
