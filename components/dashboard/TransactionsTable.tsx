import { formatCurrency, formatDate } from "@/lib/formatters";
import { sortTransactionsByMostRecent } from "@/lib/transactions";
import type { Transaction } from "@/types/transaction";

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const sortedTransactions = sortTransactionsByMostRecent(transactions);

  return (
    <section id="movimentacoes" className="dashboard-card scroll-mt-24 overflow-hidden">
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
        className="scrollbar-subtle overflow-x-auto border-t border-stone-100"
        tabIndex={0}
        role="region"
        aria-label="Tabela de movimentações com rolagem horizontal"
      >
        <table className="min-w-[960px] w-full text-left text-sm" aria-describedby="transactions-description">
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
    </section>
  );
}
