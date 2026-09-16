"use client";

import { BreakdownChart, DailyExpenseChart } from "@/components/dashboard/Charts";
import { InstallmentsCard } from "@/components/dashboard/InstallmentsCard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { Filters, type FilterValues } from "@/components/filters/Filters";
import { getAverageDailyExpense, getBalance, getDailyExpenses, getGroupedExpenses, getIncomeCommittedPercentage, getInstallments, getLargestExpenseCategory, getTotalExpenses, getTotalIncome } from "@/lib/finance";
import { filterTransactions } from "@/lib/transactions";
import { isTransactionsApiResponse, type Transaction } from "@/types/transaction";
import { useEffect, useMemo, useState } from "react";

const initialFilters: FilterValues = { period: "thisMonth", type: "all", category: "all", account: "all", query: "", startDate: "", endDate: "" };
export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    fetch("/api/transactions", { signal: controller.signal })
      .then(async (response) => {
        const data: unknown = await response.json();
        if (!isTransactionsApiResponse(data) || !response.ok || !data.ok || !Array.isArray(data.transactions)) throw new Error(isTransactionsApiResponse(data) ? data.error || "Não foi possível carregar os dados." : "Não foi possível carregar os dados.");
        setTransactions(data.transactions);
        setStatus("ready");
      })
      .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === "AbortError")) { setError(reason instanceof Error ? reason.message : "Erro inesperado."); setStatus("error"); } });
    return () => controller.abort();
  }, [requestVersion]);

  const categories = useMemo(() => [...new Set(transactions.map((item) => item.category))].sort(), [transactions]);
  const accounts = useMemo(() => [...new Set(transactions.map((item) => item.account))].sort(), [transactions]);
  const dashboardData = useMemo(() => {
    if (status !== "ready") return null;

    const filtered = filterTransactions(transactions, filters);
    return {
      filtered,
      income: getTotalIncome(filtered),
      expenses: getTotalExpenses(filtered),
      balance: getBalance(filtered),
      average: getAverageDailyExpense(filtered),
      incomeCommitted: getIncomeCommittedPercentage(filtered),
      largest: getLargestExpenseCategory(filtered),
      dailyExpenses: getDailyExpenses(filtered),
      categoryData: getGroupedExpenses(filtered, "category"),
      accountData: getGroupedExpenses(filtered, "account"),
      paymentData: getGroupedExpenses(filtered, "paymentMethod"),
      installments: getInstallments(filtered),
    };
  }, [filters, status, transactions]);

  return <main className="min-h-screen bg-canvas px-4 py-7 sm:px-8"><div className="mx-auto max-w-7xl space-y-5"><header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-pine">Controle compartilhado</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Finanças</h1></div><p className="text-sm text-stone-500">Visão clara das movimentações do casal</p></header>
    {status === "loading" && <LoadingState />}
    {status === "error" && <ErrorState error={error} onRetry={() => setRequestVersion((version) => version + 1)} />}
    {status === "ready" && dashboardData && <><Filters values={filters} categories={categories} accounts={accounts} onChange={setFilters} />
      {dashboardData.filtered.length === 0 ? <EmptyState /> : <><SummaryCards income={dashboardData.income} expenses={dashboardData.expenses} balance={dashboardData.balance} average={dashboardData.average} incomeCommitted={dashboardData.incomeCommitted} largest={dashboardData.largest} />
      <div className="grid gap-5 lg:grid-cols-2"><DailyExpenseChart data={dashboardData.dailyExpenses} /><BreakdownChart title="Gastos por categoria" data={dashboardData.categoryData} /><BreakdownChart title="Gastos por conta" data={dashboardData.accountData} /><BreakdownChart title="Gastos por forma de pagamento" data={dashboardData.paymentData} /><InstallmentsCard transactions={dashboardData.installments} /></div>
      <TransactionsTable transactions={dashboardData.filtered} /></>}</>}
  </div></main>;
}

function LoadingState() { return <div role="status" className="grid gap-4 sm:grid-cols-3"><p className="sr-only">Carregando movimentações</p>{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-stone-200" />)}</div>; }
function EmptyState() { return <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center"><h2 className="text-lg font-semibold">Nenhuma movimentação encontrada</h2><p className="mt-2 text-sm text-stone-500">Ajuste os filtros ou registre uma movimentação pelo Shortcut.</p></section>; }
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) { return <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950"><h2 className="font-semibold">Não foi possível carregar o dashboard</h2><p className="mt-1 text-sm">{error}</p><button className="mt-4 rounded-lg bg-red-800 px-3 py-2 text-sm font-semibold text-white" onClick={onRetry}>Tentar novamente</button></section>; }
