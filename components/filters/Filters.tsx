"use client";

import type { TransactionType } from "@/types/transaction";

export type Period = "thisMonth" | "lastMonth" | "thisYear" | "custom";

export interface FilterValues {
  period: Period;
  type: "all" | TransactionType;
  category: string;
  account: string;
  query: string;
  startDate: string;
  endDate: string;
}

interface Props {
  values: FilterValues;
  categories: string[];
  accounts: string[];
  resultCount: number;
  onChange: (values: FilterValues) => void;
  onReset: () => void;
}

export function Filters({ values, categories, accounts, resultCount, onChange, onReset }: Props) {
  const update = <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => {
    onChange({ ...values, [key]: value });
  };
  const activeFilterCount = getActiveFilterCount(values);
  const fieldClass = "mt-1.5 h-11 min-w-0 max-w-full w-full rounded-xl border border-stone-200 bg-stone-50/80 px-3 text-sm text-ink outline-none transition-[border-color,box-shadow,background-color] duration-150 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10";

  return (
    <section id="filtros" aria-labelledby="filters-title" className="dashboard-card min-w-0 max-w-full scroll-mt-24 overflow-hidden p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-xl bg-stone-100 text-stone-600">
            <FilterIcon />
          </div>
          <div>
            <h2 id="filters-title" className="text-sm font-semibold text-ink">Filtros</h2>
            <p aria-live="polite" className="text-xs text-stone-500">
              {resultCount} {resultCount === 1 ? "movimentação encontrada" : "movimentações encontradas"}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="pressable rounded-lg px-2.5 py-2 text-xs font-semibold text-stone-500 disabled:cursor-default disabled:opacity-40"
          disabled={activeFilterCount === 0}
          onClick={onReset}
        >
          Limpar {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
        </button>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_1fr_1.45fr]">
        <FilterLabel label="Período">
          <select
            className={fieldClass}
            value={values.period}
            onChange={(event) => update("period", event.target.value as Period)}
          >
            <option value="thisMonth">Este mês</option>
            <option value="lastMonth">Mês passado</option>
            <option value="thisYear">Este ano</option>
            <option value="custom">Personalizado</option>
          </select>
        </FilterLabel>

        <FilterLabel label="Tipo">
          <select
            className={fieldClass}
            value={values.type}
            onChange={(event) => update("type", event.target.value as FilterValues["type"])}
          >
            <option value="all">Todos</option>
            <option value="expense">Despesas</option>
            <option value="income">Receitas</option>
          </select>
        </FilterLabel>

        <FilterLabel label="Categoria">
          <select className={fieldClass} value={values.category} onChange={(event) => update("category", event.target.value)}>
            <option value="all">Todas</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </FilterLabel>

        <FilterLabel label="Conta">
          <select className={fieldClass} value={values.account} onChange={(event) => update("account", event.target.value)}>
            <option value="all">Todas</option>
            {accounts.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </FilterLabel>

        <FilterLabel label="Buscar">
          <div className="relative min-w-0">
            <span className="pointer-events-none absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-stone-400">
              <SearchIcon />
            </span>
            <input
              className={`${fieldClass} pl-9`}
              type="search"
              value={values.query}
              onChange={(event) => update("query", event.target.value)}
              placeholder="Descrição, categoria ou texto"
            />
          </div>
        </FilterLabel>
      </div>

      {values.period === "custom" && (
        <div className="mt-3 grid gap-3 border-t border-stone-100 pt-3 sm:grid-cols-2 xl:max-w-[40rem]">
          <FilterLabel label="Data inicial">
            <input
              className={fieldClass}
              type="date"
              value={values.startDate}
              max={values.endDate || undefined}
              onChange={(event) => update("startDate", event.target.value)}
            />
          </FilterLabel>
          <FilterLabel label="Data final">
            <input
              className={fieldClass}
              type="date"
              value={values.endDate}
              min={values.startDate || undefined}
              onChange={(event) => update("endDate", event.target.value)}
            />
          </FilterLabel>
        </div>
      )}
    </section>
  );
}

function FilterLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 max-w-full text-xs font-semibold text-stone-600">
      {label}
      {children}
    </label>
  );
}

function getActiveFilterCount(values: FilterValues): number {
  return [
    values.period !== "thisMonth",
    values.type !== "all",
    values.category !== "all",
    values.account !== "all",
    values.query.trim().length > 0,
  ].filter(Boolean).length;
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16M7 12h10M10 19h4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}
