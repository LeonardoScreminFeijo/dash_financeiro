"use client";

import { ChartNoAxesColumn, ChartSpline, ChevronDown } from "lucide-react";
import type { ChartView } from "./metric-chart";

export interface PeriodOption {
  label: string;
  points?: number;
}

export function PeriodSelect({
  value,
  options,
  onChange,
  accentText,
}: {
  value: string;
  options: PeriodOption[];
  onChange: (option: PeriodOption) => void;
  accentText: string;
}) {
  return (
    <label className="relative pointer-events-auto">
      <span className="sr-only">Período do gráfico</span>
      <select
        className="h-9 appearance-none rounded-xl border border-stone-200 bg-white/90 py-1 pl-3 pr-8 text-xs font-semibold text-stone-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-stone-700 dark:bg-stone-900/90 dark:text-stone-200"
        value={value}
        onChange={(event) => {
          const option = options.find((item) => item.label === event.target.value);
          if (option) onChange(option);
        }}
        style={{ color: accentText }}
      >
        {options.map((option) => (
          <option key={option.label} value={option.label}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2"
        style={{ color: accentText }}
      />
    </label>
  );
}

export function ViewToggle({ value, onChange }: { value: ChartView; onChange: (view: ChartView) => void }) {
  return (
    <div className="pointer-events-auto flex rounded-xl border border-stone-200 bg-white/85 p-0.5 shadow-sm dark:border-stone-700 dark:bg-stone-900/85" aria-label="Visualização do gráfico">
      <ViewButton active={value === "curve"} label="Exibir em curva" onClick={() => onChange("curve")}>
        <ChartSpline className="size-3.5" />
      </ViewButton>
      <ViewButton active={value === "bars"} label="Exibir em barras" onClick={() => onChange("bars")}>
        <ChartNoAxesColumn className="size-3.5" />
      </ViewButton>
    </div>
  );
}

function ViewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`grid size-7 place-items-center rounded-lg transition-colors ${
        active
          ? "bg-stone-100 text-ink dark:bg-stone-700 dark:text-stone-100"
          : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
      }`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
