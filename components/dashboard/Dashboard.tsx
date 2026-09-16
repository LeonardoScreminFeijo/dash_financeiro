"use client";

import { BreakdownChart } from "@/components/dashboard/Charts";
import { InstallmentsCard } from "@/components/dashboard/InstallmentsCard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { Filters, type FilterValues } from "@/components/filters/Filters";
import { DashboardWithCollapsibleSidebar } from "@/components/ui/dashboard-with-collapsible-sidebar";
import ProgressMetricCard from "@/components/ui/progress-metric-card";
import {
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
} from "@/lib/finance";
import { formatCurrency, formatDate, formatMonthYear, formatPercentage } from "@/lib/formatters";
import { filterTransactions } from "@/lib/transactions";
import { isTransactionsApiResponse, type Transaction } from "@/types/transaction";
import { useEffect, useMemo, useState } from "react";

const initialFilters: FilterValues = {
  period: "thisMonth",
  type: "all",
  category: "all",
  account: "all",
  query: "",
  startDate: "",
  endDate: "",
};

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
        if (!isTransactionsApiResponse(data) || !response.ok || !data.ok || !Array.isArray(data.transactions)) {
          throw new Error(
            isTransactionsApiResponse(data)
              ? data.error || "Não foi possível carregar os dados."
              : "Não foi possível carregar os dados.",
          );
        }

        setTransactions(data.transactions);
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(reason instanceof Error ? reason.message : "Erro inesperado.");
          setStatus("error");
        }
      });

    return () => controller.abort();
  }, [requestVersion]);

  const categories = useMemo(
    () => [...new Set(transactions.map((item) => item.category))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [transactions],
  );
  const accounts = useMemo(
    () => [...new Set(transactions.map((item) => item.account))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [transactions],
  );
  const periodLabel = useMemo(() => getPeriodLabel(filters), [filters]);
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
      cumulativeDailyExpenses: getCumulativeDailyExpenses(filtered),
      categoryData: getGroupedExpenses(filtered, "category"),
      accountData: getGroupedExpenses(filtered, "account"),
      paymentData: getGroupedExpenses(filtered, "paymentMethod"),
      installments: getInstallments(filtered),
    };
  }, [filters, status, transactions]);

  const resetFilters = () => setFilters(initialFilters);

  return (
    <DashboardWithCollapsibleSidebar
      periodLabel={periodLabel}
      transactionCount={dashboardData?.filtered.length}
    >
      <div className="space-y-6">
        {status === "loading" && <LoadingState />}
        {status === "error" && (
          <ErrorState error={error} onRetry={() => setRequestVersion((version) => version + 1)} />
        )}
        {status === "ready" && dashboardData && (
          <>
            <Filters
              values={filters}
              categories={categories}
              accounts={accounts}
              resultCount={dashboardData.filtered.length}
              onChange={setFilters}
              onReset={resetFilters}
            />

            {dashboardData.filtered.length === 0 ? (
              <EmptyState hasTransactions={transactions.length > 0} onReset={resetFilters} />
            ) : (
              <>
                <SummaryCards
                  income={dashboardData.income}
                  expenses={dashboardData.expenses}
                  balance={dashboardData.balance}
                  average={dashboardData.average}
                  incomeCommitted={dashboardData.incomeCommitted}
                  largest={dashboardData.largest}
                />

                <div id="analises" className="grid scroll-mt-24 gap-5 lg:grid-cols-2">
                  <ProgressMetricCard
                    key={periodLabel}
                    title="Gasto acumulado"
                    total={formatCurrency(dashboardData.expenses)}
                    delta={formatCurrency(dashboardData.dailyExpenses.at(-1)?.value ?? 0)}
                    deltaLabel="no último dia com gastos"
                    percent={
                      dashboardData.income > 0
                        ? `${formatPercentage(dashboardData.incomeCommitted)} da renda`
                        : "Sem receitas"
                    }
                    trend="up"
                    accent="rose"
                    data={dashboardData.cumulativeDailyExpenses}
                    period={periodLabel}
                    periodOptions={[
                      { label: "7 dias com gastos", points: 7 },
                      { label: "14 dias com gastos", points: 14 },
                      { label: periodLabel },
                    ]}
                    valueFormatter={formatCurrency}
                    dateFormatter={formatDate}
                    className="lg:col-span-2"
                  />
                  <BreakdownChart title="Gastos por categoria" data={dashboardData.categoryData} />
                  <BreakdownChart title="Gastos por conta" data={dashboardData.accountData} />
                  <BreakdownChart title="Gastos por pagamento" data={dashboardData.paymentData} />
                  <InstallmentsCard transactions={dashboardData.installments} />
                </div>

                <TransactionsTable transactions={dashboardData.filtered} />
              </>
            )}
          </>
        )}
      </div>
    </DashboardWithCollapsibleSidebar>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <p className="sr-only">Carregando movimentações</p>
      <div className="dashboard-card h-28 animate-pulse bg-stone-100/80" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="dashboard-card h-40 animate-pulse bg-stone-100/80" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ hasTransactions, onReset }: { hasTransactions: boolean; onReset: () => void }) {
  return (
    <section className="dashboard-card px-6 py-14 text-center sm:py-20">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-stone-100 text-stone-500">
        <SearchIcon />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">
        {hasTransactions ? "Nenhuma movimentação encontrada" : "Nenhuma movimentação registrada"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
        {hasTransactions
          ? "Ajuste ou limpe os filtros para ampliar a busca."
          : "Registre uma nova movimentação pelo Shortcut para começar a acompanhar as finanças."}
      </p>
      {hasTransactions && (
        <button
          type="button"
          className="pressable mt-5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm"
          onClick={onReset}
        >
          Limpar filtros
        </button>
      )}
    </section>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <section role="alert" className="dashboard-card dashboard-error border-red-200 bg-red-50/90 p-6 text-red-950">
      <h2 className="font-semibold">Não foi possível carregar o dashboard</h2>
      <p className="mt-1 text-sm leading-6 text-red-800">{error}</p>
      <button
        type="button"
        className="pressable mt-4 rounded-xl bg-red-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
        onClick={onRetry}
      >
        Tentar novamente
      </button>
    </section>
  );
}

function getPeriodLabel(filters: FilterValues): string {
  const today = new Date();

  if (filters.period === "thisMonth") return formatMonthYear(today);
  if (filters.period === "lastMonth") return formatMonthYear(new Date(today.getFullYear(), today.getMonth() - 1, 1));
  if (filters.period === "thisYear") return `ano de ${today.getFullYear()}`;

  if (filters.startDate && filters.endDate) {
    return `${formatDate(filters.startDate)} — ${formatDate(filters.endDate)}`;
  }
  if (filters.startDate) return `a partir de ${formatDate(filters.startDate)}`;
  if (filters.endDate) return `até ${formatDate(filters.endDate)}`;
  return "período personalizado";
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}
