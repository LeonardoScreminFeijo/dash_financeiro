import type { Transaction } from "@/types/transaction";
import type { FilterValues } from "@/components/filters/Filters";

function dateRange(period: FilterValues["period"], today: Date, startDate: string, endDate: string): [string, string] {
  const year = today.getFullYear();
  const month = today.getMonth();
  const asDate = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  if (period === "thisMonth") return [asDate(new Date(year, month, 1)), asDate(new Date(year, month + 1, 0))];
  if (period === "lastMonth") return [asDate(new Date(year, month - 1, 1)), asDate(new Date(year, month, 0))];
  if (period === "thisYear") return [`${year}-01-01`, `${year}-12-31`];
  return [startDate || "0000-01-01", endDate || "9999-12-31"];
}

export function filterTransactions(transactions: Transaction[], filters: FilterValues, today = new Date()): Transaction[] {
  const [start, end] = dateRange(filters.period, today, filters.startDate, filters.endDate);
  const query = filters.query.trim().toLocaleLowerCase("pt-BR");
  return transactions.filter((item) => {
    const searchable = `${item.description} ${item.category} ${item.originalText}`.toLocaleLowerCase("pt-BR");
    return item.date >= start && item.date <= end && (filters.type === "all" || item.type === filters.type) &&
      (filters.category === "all" || item.category === filters.category) && (filters.account === "all" || item.account === filters.account) &&
      (!query || searchable.includes(query));
  }).sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
}
