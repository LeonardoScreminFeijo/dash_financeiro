"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import {
  ACCENTS,
  formatCompact,
  MetricChart,
  SERIES_COLORS,
  type ChartSeries,
  type ChartView,
  type MetricAccent,
  type MetricSeries,
  type SeriesPoint,
} from "./metric-chart";
import { PeriodSelect, ViewToggle, type PeriodOption } from "./metric-controls";

export type { SeriesPoint, MetricSeries, MetricAccent, ChartView, PeriodOption };

export type CardSize = "sm" | "md" | "lg";

export interface ProgressMetricCardProps {
  title: string;
  total?: string | number;
  delta?: string;
  deltaLabel?: string;
  percent?: string;
  trend?: "up" | "down";
  unit?: string;
  period?: string;
  periodOptions?: PeriodOption[];
  onPeriodChange?: (option: PeriodOption) => void;
  defaultView?: ChartView;
  accent?: MetricAccent;
  data?: SeriesPoint[];
  series?: MetricSeries[];
  defaultIndex?: number;
  size?: CardSize;
  showStats?: boolean;
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: string) => string;
  loading?: boolean;
  className?: string;
}

const DEFAULT_PERIODS: PeriodOption[] = [
  { label: "Últimos 7 dias", points: 7 },
  { label: "Últimos 14 dias", points: 14 },
  { label: "Período completo" },
];

const REGION_WIDTH = 62;
const NEUTRAL_PERCENTAGE = 0.5;

const SIZES: Record<
  CardSize,
  { minHeight: string; padding: string; footer: string; title: string; headline: string }
> = {
  sm: {
    minHeight: "min-h-[260px]",
    padding: "px-5 pt-5 sm:px-6",
    footer: "px-5 py-3 sm:px-6",
    title: "text-[15px]",
    headline: "text-[clamp(2.25rem,10vw,2.875rem)]",
  },
  md: {
    minHeight: "min-h-[360px]",
    padding: "px-5 pt-6 sm:px-8 sm:pt-7",
    footer: "px-5 py-4 sm:px-8",
    title: "text-[17px]",
    headline: "text-[clamp(2.25rem,8vw,4.5rem)]",
  },
  lg: {
    minHeight: "min-h-[440px]",
    padding: "px-5 pt-7 sm:px-10 sm:pt-9",
    footer: "px-5 py-5 sm:px-10",
    title: "text-[19px]",
    headline: "text-[clamp(3rem,8vw,5.5rem)]",
  },
};

const sliceWindow = (points: SeriesPoint[], count?: number) =>
  count && count < points.length ? points.slice(-count) : points;

export default function ProgressMetricCard({
  title,
  total,
  delta,
  deltaLabel = "hoje",
  percent,
  trend,
  unit,
  period = "Período completo",
  periodOptions,
  onPeriodChange,
  defaultView = "curve",
  accent,
  data,
  series,
  defaultIndex,
  size = "md",
  showStats = true,
  valueFormatter,
  dateFormatter,
  loading = false,
  className = "",
}: ProgressMetricCardProps) {
  const gridId = `grid-${useId().replace(/:/g, "")}`;
  const cardSize = SIZES[size];
  const shell = `dashboard-card relative flex ${cardSize.minHeight} min-w-0 max-w-full w-full flex-col overflow-hidden rounded-[28px] ${className}`;
  const periods = periodOptions?.length ? periodOptions : DEFAULT_PERIODS;
  const [selectedLabel, setSelectedLabel] = useState(period);
  const [view, setView] = useState<ChartView>(defaultView);

  const baseSeries: MetricSeries[] = useMemo(
    () => (series?.length ? series : [{ name: title, data: data ?? [], accent }]),
    [series, data, title, accent],
  );
  const selectedOption = periods.find((option) => option.label === selectedLabel) ?? periods[periods.length - 1];
  const visibleSeries = useMemo(
    () => baseSeries.map((item) => ({ ...item, data: sliceWindow(item.data, selectedOption?.points) })),
    [baseSeries, selectedOption],
  );
  const primary = visibleSeries[0];
  const isMultiSeries = visibleSeries.length > 1;
  const hasData = (primary?.data.length ?? 0) >= 2;

  const stats = useMemo(() => {
    const values = primary?.data.map((point) => point.value) ?? [];
    const sum = values.reduce((current, value) => current + value, 0);
    const first = values[0] ?? 0;
    const last = values[values.length - 1] ?? 0;
    const previous = values[values.length - 2] ?? first;
    const net = last - first;

    return {
      sum,
      net,
      percentage: first ? (net / first) * 100 : 0,
      step: last - previous,
      peak: values.length ? Math.max(...values) : 0,
      low: values.length ? Math.min(...values) : 0,
      average: values.length ? sum / values.length : 0,
    };
  }, [primary]);

  const resolvedTrend: "up" | "down" | "flat" =
    trend ??
    (Math.abs(stats.percentage) < NEUTRAL_PERCENTAGE ? "flat" : stats.net >= 0 ? "up" : "down");
  const resolvedAccent: MetricAccent =
    accent ?? (resolvedTrend === "up" ? "green" : resolvedTrend === "down" ? "red" : "neutral");
  const color = ACCENTS[resolvedAccent];
  const TrendIcon = resolvedTrend === "flat" ? ArrowRight : resolvedTrend === "down" ? ArrowDown : ArrowUp;
  const formatShortValue = valueFormatter ?? formatCompact;
  const formatFullValue = valueFormatter ?? ((value: number) => value.toLocaleString("pt-BR") + (unit ? ` ${unit}` : ""));
  const formatDateValue = dateFormatter ?? ((date: string) => date);
  const formatSignedValue = (value: number) => `${value >= 0 ? "+" : "−"}${formatShortValue(Math.abs(value))}`;
  const displayTotal = total ?? formatShortValue(stats.sum);
  const displayDelta = delta ?? formatSignedValue(stats.step);
  const displayPercentage = percent ?? `${Math.abs(stats.percentage).toFixed(1)}%`;
  const chartSeries: ChartSeries[] = visibleSeries.map((item, index) => ({
    name: item.name,
    data: item.data,
    color: item.accent
      ? ACCENTS[item.accent].stroke
      : isMultiSeries
        ? SERIES_COLORS[index % SERIES_COLORS.length]
        : color.stroke,
  }));
  const lastIndex = (primary?.data.length ?? 1) - 1;
  const fallbackIndex = Math.min(defaultIndex ?? lastIndex, lastIndex);

  const handlePeriodChange = (option: PeriodOption) => {
    setSelectedLabel(option.label);
    onPeriodChange?.(option);
  };

  if (loading) {
    return (
      <div className={shell} aria-busy="true">
        <div className={`flex flex-1 flex-col ${cardSize.padding}`}>
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
            <div className="h-5 w-24 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
          </div>
          <div className="mt-6 h-14 w-48 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" />
          <div className="mt-auto h-24 w-full animate-pulse rounded-lg bg-stone-100 dark:bg-stone-800" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={shell}>
        <div className={`flex flex-1 flex-col ${cardSize.padding}`}>
          <h3 className={`${cardSize.title} font-semibold tracking-tight text-ink dark:text-stone-100`}>{title}</h3>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center">
            <p className="text-sm font-medium text-ink dark:text-stone-100">Ainda não há dados suficientes</p>
            <p className="text-xs text-stone-500">O gráfico aparecerá após despesas em pelo menos dois dias.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={shell} aria-label={title}>
      <div className="absolute inset-y-0 right-0 z-0" style={{ width: `${REGION_WIDTH}%` }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(to left, ${color.stroke}1f, transparent 75%)` }} />
        <div
          className="absolute inset-0 text-stone-900/[0.13] dark:text-white/[0.1]"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent, black 55%)",
            maskImage: "linear-gradient(to right, transparent, black 55%)",
          }}
        >
          <svg className="h-full w-full" aria-hidden="true">
            <defs>
              <pattern id={gridId} width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${gridId})`} />
          </svg>
        </div>
        <MetricChart
          series={chartSeries}
          view={view}
          defaultIndex={fallbackIndex}
          valueFormatter={formatFullValue}
          dateFormatter={formatDateValue}
        />
      </div>

      <div className={`pointer-events-none relative z-10 flex flex-1 flex-col ${cardSize.padding}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className={`${cardSize.title} font-semibold tracking-tight text-ink dark:text-stone-100`}>{title}</h3>
            <ViewToggle value={view} onChange={setView} />
          </div>
          <div className="flex items-center gap-2 text-xs sm:gap-3.5 sm:text-sm">
            <span className="flex items-center gap-1 font-semibold" style={{ color: color.text }}>
              <TrendIcon size={16} strokeWidth={2.5} />
              {displayPercentage}
            </span>
            <PeriodSelect value={selectedLabel} options={periods} onChange={handlePeriodChange} accentText={color.text} />
          </div>
        </div>

        {isMultiSeries && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            {chartSeries.map((item) => (
              <span key={item.name} className="flex items-center gap-1.5 text-xs text-stone-500">
                <span className="size-2 rounded-full" style={{ background: item.color }} />
                {item.name}
              </span>
            ))}
          </div>
        )}

        <div className={`mt-6 min-w-0 max-w-full break-words sm:max-w-[70%] ${cardSize.headline} font-medium leading-none tracking-[-0.045em] text-ink dark:text-stone-100`}>
          {displayTotal}
        </div>
      </div>

      <footer className={`relative z-10 flex flex-col gap-2 border-t border-stone-200/70 bg-white/95 dark:border-stone-700 dark:bg-stone-900/95 sm:flex-row sm:items-center sm:justify-between ${cardSize.footer} text-sm`}>
        <div>
          <span className="font-semibold" style={{ color: color.text }}>{displayDelta}</span>{" "}
          <span className="text-stone-500">{deltaLabel}</span>
        </div>
        {showStats && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 sm:gap-2.5 sm:text-xs">
            <span><span className="font-semibold text-stone-700 dark:text-stone-300">{formatShortValue(stats.peak)}</span> maior</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span><span className="font-semibold text-stone-700 dark:text-stone-300">{formatShortValue(stats.low)}</span> menor</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span><span className="font-semibold text-stone-700 dark:text-stone-300">{formatShortValue(Math.round(stats.average))}</span> média</span>
          </div>
        )}
      </footer>
    </section>
  );
}
