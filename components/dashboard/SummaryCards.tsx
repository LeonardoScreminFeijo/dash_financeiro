import { formatCurrency } from "@/lib/formatters";

interface Props { income: number; expenses: number; balance: number; average: number; incomeCommitted: number; largest: { label: string; value: number } | undefined }
export function SummaryCards({ income, expenses, balance, average, incomeCommitted, largest }: Props) {
  const cards = [
    ["Receitas", formatCurrency(income), "text-pine"], ["Despesas", formatCurrency(expenses), "text-coral", `${incomeCommitted.toFixed(1)}% da renda comprometida`],
    ["Saldo", formatCurrency(balance), balance >= 0 ? "text-pine" : "text-coral"], ["Gasto médio diário", formatCurrency(average), "text-ink"],
    ["Maior categoria", largest ? largest.label : "—", "text-ink", largest ? formatCurrency(largest.value) : undefined],
  ];
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([title, value, color, detail]) => <article key={title} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><p className="text-sm text-stone-500">{title}</p><p className={`mt-2 text-2xl font-bold tracking-tight ${color}`}>{value}</p>{detail && <p className="mt-1 text-xs text-stone-500">{detail}</p>}</article>)}</section>;
}
