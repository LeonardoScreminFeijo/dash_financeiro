"use client";

import { formatCompactCurrency, formatCurrency, formatDate, formatShortDate } from "@/lib/formatters";
import type { DailyExpense, ValueByLabel } from "@/lib/finance";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";

const COLORS = ["#176b4e", "#43866d", "#77a590", "#e6a243", "#cc6a52", "#7767a8"];
const MAX_BREAKDOWN_ITEMS = 6;
const tooltipProps = {
  formatter: (value: ValueType) => formatCurrency(Number(Array.isArray(value) ? value[0] : value)),
  contentStyle: {
    borderRadius: 12,
    borderColor: "var(--chart-border)",
    backgroundColor: "var(--chart-surface)",
    color: "var(--chart-muted)",
    boxShadow: "0 10px 30px rgba(23, 33, 29, 0.08)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--chart-muted)", fontWeight: 600 },
};

export function DailyExpenseChart({ data }: { data: DailyExpense[] }) {
  return (
    <ChartCard
      title="Evolução diária dos gastos"
      description="Total de despesas registrado em cada dia"
      className="lg:col-span-2"
    >
      {data.length === 0 ? (
        <ChartEmptyState message="Nenhuma despesa para exibir neste período." />
      ) : (
        <div className="h-[280px] min-w-0 w-full" role="img" aria-label="Gráfico de evolução diária das despesas">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} accessibilityLayer>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatShortDate(String(value))}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
                tickMargin={12}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={(value) => formatCompactCurrency(Number(value))}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--chart-muted)", fontSize: 11 }}
                tickMargin={8}
                width={64}
                domain={[0, "auto"]}
              />
              <Tooltip
                {...tooltipProps}
                cursor={{ stroke: "var(--chart-border)", strokeDasharray: "3 3" }}
                labelFormatter={(value) => formatDate(String(value))}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Gastos"
                stroke="#176b4e"
                strokeWidth={2.5}
                dot={data.length === 1 ? { r: 5, fill: "#176b4e", stroke: "#ffffff", strokeWidth: 3 } : false}
                activeDot={{ r: 5, fill: "#176b4e", stroke: "#ffffff", strokeWidth: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

export function BreakdownChart({ title, data }: { title: string; data: ValueByLabel[] }) {
  const displayedData = [...data].sort((a, b) => b.value - a.value).slice(0, MAX_BREAKDOWN_ITEMS);
  const hiddenItems = Math.max(0, data.length - displayedData.length);

  return (
    <ChartCard
      title={title}
      description={hiddenItems > 0 ? `Top ${MAX_BREAKDOWN_ITEMS} de ${data.length} grupos` : "Do maior para o menor"}
    >
      {displayedData.length === 0 ? (
        <ChartEmptyState message="Nenhuma despesa para esta distribuição." />
      ) : (
        <div className="h-[280px] min-w-0 w-full" role="img" aria-label={`Gráfico de ${title.toLocaleLowerCase("pt-BR")}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayedData} layout="vertical" margin={{ top: 4, right: 10, left: 8, bottom: 4 }} accessibilityLayer>
              <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                axisLine={false}
                tickLine={false}
                width={112}
                tick={{ fill: "var(--chart-muted)", fontSize: 12 }}
                tickFormatter={truncateLabel}
              />
              <Tooltip {...tooltipProps} cursor={{ fill: "var(--chart-grid)" }} />
              <Bar dataKey="value" name="Gastos" radius={[0, 7, 7, 0]} barSize={20} isAnimationActive={false}>
                {displayedData.map((entry, index) => (
                  <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

function ChartCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`dashboard-card min-w-0 p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mt-1 text-xs text-stone-500">{description}</p>
        </div>
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-500">
          <ChartIcon />
        </div>
      </div>
      {children}
    </section>
  );
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="grid h-[280px] place-items-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 px-6 text-center">
      <div>
        <div className="mx-auto grid size-10 place-items-center rounded-xl bg-white text-stone-400 shadow-sm">
          <ChartIcon />
        </div>
        <p className="mt-3 text-sm text-stone-500">{message}</p>
      </div>
    </div>
  );
}

function truncateLabel(value: string): string {
  return value.length > 16 ? `${value.slice(0, 15)}…` : value;
}

function ChartIcon() {
  return (
    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />
    </svg>
  );
}
