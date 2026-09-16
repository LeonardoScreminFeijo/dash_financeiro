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

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/transactions", { signal: controller.signal })
      .then(async (response) => {
        const data: unknown = await response.json();
        if (!isTransactionsApiResponse(data) || !response.ok || !data.ok || !Array.isArray(data.transactions)) throw new Error(isTransactionsApiResponse(data) ? data.error || "Não foi possível carregar os dados." : "Não foi possível carregar os dados.");
        setTransactions(data.transactions);
        setStatus("ready");
      })
      .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === "AbortError")) { setError(reason instanceof Error ? reason.message : "Erro inesperado."); setStatus("error"); } });
    return () => controller.abort();
  }, []);

  const categories = useMemo(() => [...new Set(transactions.map((item) => item.category))].sort(), [transactions]);
  const accounts = useMemo(() => [...new Set(transactions.map((item) => item.account))].sort(), [transactions]);
  const filtered = useMemo(() => filterTransactions(transactions, filters), [transactions, filters]);
  const income = useMemo(() => getTotalIncome(filtered), [filtered]);
  const expenses = useMemo(() => getTotalExpenses(filtered), [filtered]);
  const categoryData = useMemo(() => getGroupedExpenses(filtered, "category"), [filtered]);
  const accountData = useMemo(() => getGroupedExpenses(filtered, "account"), [filtered]);
  const paymentData = useMemo(() => getGroupedExpenses(filtered, "paymentMethod"), [filtered]);

  return <main className="min-h-screen bg-canvas px-4 py-7 sm:px-8"><div className="mx-auto max-w-7xl space-y-5"><header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-pine">Controle compartilhado</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Finanças</h1></div><p className="text-sm text-stone-500">Visão clara das movimentações do casal</p></header>
    {status === "loading" && <LoadingState />}
    {status === "error" && <ErrorState error={error} />}
    {status === "ready" && <><Filters values={filters} categories={categories} accounts={accounts} onChange={setFilters} />
      {filtered.length === 0 ? <EmptyState /> : <><SummaryCards income={income} expenses={expenses} balance={getBalance(filtered)} average={getAverageDailyExpense(filtered)} incomeCommitted={getIncomeCommittedPercentage(filtered)} largest={getLargestExpenseCategory(filtered)} />
      <div className="grid gap-5 lg:grid-cols-2"><DailyExpenseChart data={getDailyExpenses(filtered)} /><BreakdownChart title="Gastos por categoria" data={categoryData} /><BreakdownChart title="Gastos por conta" data={accountData} /><BreakdownChart title="Gastos por forma de pagamento" data={paymentData} /><InstallmentsCard transactions={getInstallments(filtered)} /></div>
      <TransactionsTable transactions={filtered} /></>}</>}
  </div></main>;
}

function LoadingState() { return <div role="status" className="grid gap-4 sm:grid-cols-3"><p className="sr-only">Carregando movimentações</p>{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-stone-200" />)}</div>; }
function EmptyState() { return <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center"><h2 className="text-lg font-semibold">Nenhuma movimentação encontrada</h2><p className="mt-2 text-sm text-stone-500">Ajuste os filtros ou registre uma movimentação pelo Shortcut.</p></section>; }
function ErrorState({ error }: { error: string }) { return <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950"><h2 className="font-semibold">Não foi possível carregar o dashboard</h2><p className="mt-1 text-sm">{error}</p><button className="mt-4 rounded-lg bg-red-800 px-3 py-2 text-sm font-semibold text-white" onClick={() => window.location.reload()}>Tentar novamente</button></section>; }
