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

interface Props { values: FilterValues; categories: string[]; accounts: string[]; onChange: (values: FilterValues) => void }

export function Filters({ values, categories, accounts, onChange }: Props) {
  const update = <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => onChange({ ...values, [key]: value });
  const inputClass = "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/15";
  return <section aria-label="Filtros" className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-sm font-medium">Período<select className={inputClass} value={values.period} onChange={(event) => update("period", event.target.value as Period)}><option value="thisMonth">Este mês</option><option value="lastMonth">Mês passado</option><option value="thisYear">Este ano</option><option value="custom">Personalizado</option></select></label>
      <label className="text-sm font-medium">Tipo<select className={inputClass} value={values.type} onChange={(event) => update("type", event.target.value as FilterValues["type"])}><option value="all">Todos</option><option value="expense">Despesas</option><option value="income">Receitas</option></select></label>
      <label className="text-sm font-medium">Categoria<select className={inputClass} value={values.category} onChange={(event) => update("category", event.target.value)}><option value="all">Todas</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="text-sm font-medium">Conta<select className={inputClass} value={values.account} onChange={(event) => update("account", event.target.value)}><option value="all">Todas</option>{accounts.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="text-sm font-medium">Buscar<input className={inputClass} value={values.query} onChange={(event) => update("query", event.target.value)} placeholder="Descrição ou texto" /></label>
    </div>
    {values.period === "custom" && <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Início<input className={inputClass} type="date" value={values.startDate} onChange={(event) => update("startDate", event.target.value)} /></label><label className="text-sm font-medium">Fim<input className={inputClass} type="date" value={values.endDate} onChange={(event) => update("endDate", event.target.value)} /></label></div>}
  </section>;
}
