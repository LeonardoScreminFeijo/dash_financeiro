import { formatCurrency, formatDate } from "@/lib/formatters";
import { sortTransactionsByMostRecent } from "@/lib/transactions";
import type { Transaction } from "@/types/transaction";

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const sortedTransactions = sortTransactionsByMostRecent(transactions);

  return (
    <section id="movimentacoes" className="dashboard-card w-full min-w-0 max-w-full scroll-mt-24 overflow-hidden">
      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">Movimentações</h2>
          <p id="transactions-description" className="mt-1 text-xs text-stone-500">Lançamentos mais recentes primeiro</p>
        </div>
        <span className="w-fit rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
          {sortedTransactions.length} {sortedTransactions.length === 1 ? "resultado" : "resultados"}
        </span>
      </div>

      <div
        className="w-full min-w-0 max-w-full border-t border-stone-100"
        role="region"
        aria-label="Movimentações"
        aria-describedby="transactions-description"
      >
        <ul className="divide-y divide-stone-100 sm:hidden">
          {sortedTransactions.map((item, index) => {
            const isIncome = item.type === "income";

            return (
              <li key={`${item.date}-${item.time}-${item.description}-${index}`} className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-ink">{item.description}</p>
                    <span className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${isIncome ? "text-emerald-700" : "text-red-700"}`}>
                      <span className={`size-1.5 rounded-full ${isIncome ? "bg-emerald-600" : "bg-red-500"}`} aria-hidden="true" />
                      {isIncome ? "Receita" : "Despesa"}
                    </span>
                  </div>
                  <p className={`shrink-0 text-right text-sm font-bold tabular-nums ${isIncome ? "text-emerald-700" : "text-red-700"}`}>
                    <span className="sr-only">{isIncome ? "Receita de" : "Despesa de"}</span>
                    {isIncome ? "+" : "−"} {formatCurrency(item.amount)}
                  </p>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  {item.installment && <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs font-semibold text-stone-600">{item.installment}</span>}
                </div>

                <dl className="mt-3 grid gap-2 text-xs">
                  <div className="flex items-start justify-between gap-4">
                    <dt className="font-medium text-stone-500">{formatDate(item.date)}</dt>
                    {item.time && <dd className="shrink-0 tabular-nums text-right text-stone-700">{item.time}</dd>}
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 font-medium text-stone-500">Categoria</dt>
                    <dd className="break-words text-right text-stone-700">{item.category}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 font-medium text-stone-500">Conta</dt>
                    <dd className="break-words text-right text-stone-700">{item.account}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 font-medium text-stone-500">Pagamento</dt>
                    <dd className="break-words text-right text-stone-700">{item.paymentMethod}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>

        <div
          className="scrollbar-subtle hidden w-full min-w-0 max-w-full overflow-x-auto sm:block"
          tabIndex={0}
          role="region"
          aria-label="Tabela de movimentações com rolagem horizontal"
        >
          <table className="min-w-[960px] w-full text-left text-sm">
          <thead className="bg-stone-50/90 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
            <tr>
              <th scope="col" className="px-5 py-3.5">Data</th>
              <th scope="col" className="px-5 py-3.5">Descrição</th>
              <th scope="col" className="px-5 py-3.5">Categoria</th>
              <th scope="col" className="px-5 py-3.5">Conta</th>
              <th scope="col" className="px-5 py-3.5">Pagamento</th>
              <th scope="col" className="px-5 py-3.5 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sortedTransactions.map((item, index) => {
              const isIncome = item.type === "income";
              return (
                <tr key={`${item.date}-${item.time}-${item.description}-${index}`} className="transition-colors duration-150 hover:bg-stone-50/70">
                  <td className="whitespace-nowrap px-5 py-4 align-top">
                    <p className="font-medium text-stone-700">{formatDate(item.date)}</p>
                    {item.time && <p className="mt-0.5 text-xs tabular-nums text-stone-400">{item.time}</p>}
                  </td>
                  <td className="max-w-64 px-5 py-4 align-top">
                    <p className="truncate font-semibold text-ink" title={item.description}>{item.description}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`size-1.5 rounded-full ${isIncome ? "bg-emerald-600" : "bg-red-500"}`} aria-hidden="true" />
                      <span className={`text-xs font-medium ${isIncome ? "text-emerald-700" : "text-red-700"}`}>
                        {isIncome ? "Receita" : "Despesa"}
                      </span>
                      {item.installment && (
                        <>
                          <span aria-hidden="true" className="text-stone-300">•</span>
                          <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs font-semibold text-stone-600">{item.installment}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top text-stone-600">{item.category}</td>
                  <td className="px-5 py-4 align-top text-stone-600">{item.account}</td>
                  <td className="px-5 py-4 align-top text-stone-600">{item.paymentMethod}</td>
                  <td className={`whitespace-nowrap px-5 py-4 text-right align-top font-bold tabular-nums ${isIncome ? "text-emerald-700" : "text-red-700"}`}>
                    <span className="sr-only">{isIncome ? "Receita de" : "Despesa de"}</span>
                    {isIncome ? "+" : "−"} {formatCurrency(item.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
