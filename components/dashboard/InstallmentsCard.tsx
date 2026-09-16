import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Transaction } from "@/types/transaction";

export function InstallmentsCard({ transactions }: { transactions: Transaction[] }) {
  return (
    <section id="parcelamentos" className="dashboard-card min-w-0 scroll-mt-24 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">Compras parceladas</h2>
          <p className="mt-1 text-xs text-stone-500">Parcelamentos acima de 1x no período</p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          {transactions.length} {transactions.length === 1 ? "compra" : "compras"}
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="mt-4 grid h-[280px] place-items-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 px-6 text-center">
          <div>
            <div className="mx-auto grid size-10 place-items-center rounded-xl bg-white text-stone-400 shadow-sm">
              <CardIcon />
            </div>
            <p className="mt-3 text-sm font-medium text-stone-600">Nenhuma compra parcelada</p>
            <p className="mt-1 text-xs text-stone-400">Não há despesas acima de 1x neste período.</p>
          </div>
        </div>
      ) : (
        <ul className="scrollbar-subtle mt-4 max-h-[280px] divide-y divide-stone-100 overflow-y-auto pr-1">
          {transactions.map((item, index) => (
            <li key={`${item.date}-${item.time}-${item.description}-${index}`} className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-1">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink" title={item.description}>{item.description}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                  <span>{formatDate(item.date)}</span>
                  <span aria-hidden="true" className="text-stone-300">•</span>
                  <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-semibold text-stone-600">{item.installment}</span>
                </div>
              </div>
              <strong className="shrink-0 text-sm font-semibold tabular-nums text-ink">{formatCurrency(item.amount)}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CardIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18M7 15h3" />
    </svg>
  );
}
