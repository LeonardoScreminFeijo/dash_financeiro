"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

export type ChartView = "curve" | "bars";
export type MetricAccent = "emerald" | "rose" | "amber" | "blue" | "neutral";

export interface SeriesPoint {
  value: number;
  date: string;
}

export interface MetricSeries {
  name: string;
  data: SeriesPoint[];
  accent?: MetricAccent;
}

export interface ChartSeries {
  name: string;
  data: SeriesPoint[];
  color: string;
}

export const ACCENTS: Record<MetricAccent, { stroke: string; text: string }> = {
  emerald: { stroke: "#059669", text: "#047857" },
  rose: { stroke: "#e11d48", text: "#e11d48" },
  amber: { stroke: "#d97706", text: "#b45309" },
  blue: { stroke: "#2563eb", text: "#1d4ed8" },
  neutral: { stroke: "#78716c", text: "#57534e" },
};

export const SERIES_COLORS = ["#176b4e", "#2563eb", "#d97706", "#7c3aed", "#e11d48"];

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function MetricChart({
  series,
  view,
  defaultIndex,
  valueFormatter,
  dateFormatter,
}: {
  series: ChartSeries[];
  view: ChartView;
  defaultIndex: number;
  valueFormatter: (value: number) => string;
  dateFormatter: (date: string) => string;
}) {
  const gradientId = `metric-fill-${useId().replace(/:/g, "")}`;
  const chartData = useMemo(() => {
    const rows = new Map<string, Record<string, string | number>>();

    for (const item of series) {
      for (const point of item.data) {
        const row = rows.get(point.date) ?? { date: point.date };
        row[item.name] = point.value;
        rows.set(point.date, row);
      }
    }

    return [...rows.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [series]);

  const tooltip = (
    <Tooltip
      defaultIndex={defaultIndex}
      formatter={(value: ValueType, name: NameType) => [valueFormatter(Number(value)), String(name)]}
      labelFormatter={(label) => dateFormatter(String(label))}
      contentStyle={{
        borderRadius: 12,
        borderColor: "var(--chart-border)",
        background: "var(--chart-surface)",
        color: "var(--chart-muted)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        fontSize: 12,
      }}
      cursor={{ stroke: "var(--chart-border)", strokeDasharray: "3 3" }}
    />
  );

  if (view === "bars") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 64, right: 18, bottom: 50, left: 18 }} accessibilityLayer>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="date" hide />
          {tooltip}
          {series.map((item) => (
            <Bar key={item.name} dataKey={item.name} fill={item.color} fillOpacity={0.72} radius={[5, 5, 0, 0]} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 64, right: 18, bottom: 50, left: 18 }} accessibilityLayer>
        <defs>
          {series.map((item, index) => (
            <linearGradient key={item.name} id={`${gradientId}-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={item.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={item.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="date" hide />
        {tooltip}
        {series.map((item, index) => (
          <Area
            key={item.name}
            type="monotone"
            dataKey={item.name}
            stroke={item.color}
            strokeWidth={2.5}
            fill={`url(#${gradientId}-${index})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: item.color }}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
