import { ArrowDownLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { sortTransactionsByMostRecent } from "@/lib/transactions";
import type { Transaction } from "@/types/transaction";

const MAX_RECENT_TRANSACTIONS = 5;

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const recentTransactions = sortTransactionsByMostRecent(transactions).slice(0, MAX_RECENT_TRANSACTIONS);

  return (
    <section id="ultimos-lancamentos" className="dashboard-card flex min-h-[360px] min-w-0 flex-col p-4 sm:p-5" aria-labelledby="recent-transactions-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Atualizações</p>
          <h2 id="recent-transactions-title" className="mt-1 text-base font-semibold tracking-tight text-ink">Últimos lançamentos</h2>
          <p className="mt-1 text-xs text-slate-500">Os cinco registros mais recentes do período.</p>
        </div>
        <a
          href="#movimentacoes"
          className="pressable flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary hover:bg-blue-50 dark:hover:bg-blue-950"
        >
          Ver todos <ArrowRight className="size-3.5" aria-hidden="true" />
        </a>
      </div>

      <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
        {recentTransactions.map((transaction, index) => {
          const isIncome = transaction.type === "income";
          const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

          return (
            <li key={`${transaction.date}-${transaction.time}-${transaction.description}-${index}`} className="flex items-center gap-3 py-3 first:pt-0">
              <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${isIncome ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink" title={transaction.description}>{transaction.description}</p>
                <p className="mt-0.5 truncate text-xs text-stone-500">{transaction.category} · {formatDate(transaction.date)}</p>
              </div>
              <span className={`shrink-0 text-sm font-bold tabular-nums ${isIncome ? "text-emerald-800" : "text-red-800"}`}>
                {isIncome ? "+" : "−"} {formatCurrency(transaction.amount)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
