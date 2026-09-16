export const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

const monthYearFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  return Number.isFinite(value) ? currencyFormatter.format(value) : "—";
}

export function formatDate(date: string): string {
  const parsed = parseIsoDate(date);
  return parsed ? dateFormatter.format(parsed) : "—";
}

export function formatShortDate(date: string): string {
  const parsed = parseIsoDate(date);
  return parsed ? shortDateFormatter.format(parsed) : "—";
}

export function formatMonthYear(date: Date): string {
  return Number.isNaN(date.getTime()) ? "—" : monthYearFormatter.format(date);
}

export function formatPercentage(value: number): string {
  return Number.isFinite(value) ? `${percentageFormatter.format(value)}%` : "—";
}

export function formatCompactCurrency(value: number): string {
  return Number.isFinite(value) ? compactCurrencyFormatter.format(value) : "—";
}

function parseIsoDate(date: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isValid = parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;

  return isValid ? parsed : undefined;
}
