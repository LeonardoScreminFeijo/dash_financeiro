import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface Props {
  income: number;
  expenses: number;
  balance: number;
  average: number;
  incomeCommitted: number;
  largest: { label: string; value: number } | undefined;
}

type Tone = "positive" | "negative" | "warning" | "neutral";
type MetricIconName = "income" | "expense" | "committed" | "balance" | "average" | "category";

interface MetricCard {
  title: string;
  value: string;
  detail: string;
  tone: Tone;
  icon: MetricIconName;
  compactValue?: boolean;
}

const toneStyles: Record<Tone, { icon: string; value: string }> = {
  positive: { icon: "bg-emerald-50 text-emerald-700", value: "text-emerald-800" },
  negative: { icon: "bg-red-50 text-red-700", value: "text-red-800" },
  warning: { icon: "bg-amber-50 text-amber-700", value: "text-amber-800" },
  neutral: { icon: "bg-stone-100 text-stone-600", value: "text-ink" },
};

export function SummaryCards({ income, expenses, balance, average, incomeCommitted, largest }: Props) {
  const cards: MetricCard[] = [
    {
      title: "Receitas",
      value: formatCurrency(income),
      detail: "Entradas no período",
      tone: "positive",
      icon: "income",
    },
    {
      title: "Despesas",
      value: formatCurrency(expenses),
      detail: "Saídas no período",
      tone: "negative",
      icon: "expense",
    },
    {
      title: "Renda comprometida",
      value: formatPercentage(incomeCommitted),
      detail: income > 0 ? "Das receitas do período" : "Sem receitas no período",
      tone: "warning",
      icon: "committed",
    },
    {
      title: "Saldo",
      value: formatCurrency(balance),
      detail: "Receitas menos despesas",
      tone: balance >= 0 ? "positive" : "negative",
      icon: "balance",
    },
    {
      title: "Gasto médio diário",
      value: formatCurrency(average),
      detail: "Nos dias com despesas",
      tone: "neutral",
      icon: "average",
    },
    {
      title: "Maior categoria",
      value: largest?.label ?? "Sem despesas",
      detail: formatCurrency(largest?.value ?? 0),
      tone: "neutral",
      icon: "category",
      compactValue: true,
    },
  ];

  return (
    <section id="visao-geral" className="scroll-mt-24" aria-labelledby="summary-title">
      <h2 id="summary-title" className="sr-only">Resumo financeiro</h2>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => {
          const styles = toneStyles[card.tone];
          return (
            <div key={card.title} className="dashboard-card min-w-0 p-4 sm:p-5">
              <div className={`grid size-9 place-items-center rounded-xl ${styles.icon}`}>
                <MetricIcon name={card.icon} />
              </div>
              <dt className="mt-4 text-xs font-semibold text-stone-500">{card.title}</dt>
              <dd className={`mt-1.5 truncate font-bold tracking-[-0.025em] tabular-nums ${card.compactValue ? "text-xl" : "text-2xl"} ${styles.value}`} title={card.value}>
                {card.value}
              </dd>
              <p className="mt-1.5 truncate text-xs text-stone-400" title={card.detail}>{card.detail}</p>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function MetricIcon({ name }: { name: MetricIconName }) {
  const commonProps = {
    "aria-hidden": true,
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "income") return <svg {...commonProps}><path d="M12 20V5M7 10l5-5 5 5" /><path d="M5 20h14" /></svg>;
  if (name === "expense") return <svg {...commonProps}><path d="M12 4v15M7 14l5 5 5-5" /><path d="M5 4h14" /></svg>;
  if (name === "committed") return <svg {...commonProps}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  if (name === "balance") return <svg {...commonProps}><path d="M4 7h16M4 17h16M8 3 4 7l4 4M16 13l4 4-4 4" /></svg>;
  if (name === "average") return <svg {...commonProps}><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" /></svg>;
  return <svg {...commonProps}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>;
}
