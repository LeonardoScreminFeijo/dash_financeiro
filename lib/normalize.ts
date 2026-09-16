import type { RawTransaction, Transaction } from "@/types/transaction";

const getString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const getNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? Math.abs(value) : 0;
  const raw = getString(value).replace(/[^0-9,.-]/g, "");
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

const normalizeDate = (value: unknown): string => {
  const date = getString(value);
  if (!date) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
  const brazilianDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (brazilianDate) return `${brazilianDate[3]}-${brazilianDate[2]}-${brazilianDate[1]}`;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toISOString().slice(0, 10);
};

export function mapTransaction(row: RawTransaction): Transaction {
  const rawType = getString(row.Tipo ?? row.type).toLowerCase();

  return {
    date: normalizeDate(row.Data ?? row.date),
    time: getString(row.Hora ?? row.time),
    type: rawType === "income" || rawType === "receita" ? "income" : "expense",
    category: getString(row.Categoria ?? row.category) || "Sem categoria",
    description: getString(row["Descrição"] ?? row.Descricao ?? row.description) || "Sem descrição",
    amount: getNumber(row.Valor ?? row.amount),
    account: getString(row.Conta ?? row.account) || "Não informada",
    paymentMethod: getString(row.Pagamento ?? row.paymentMethod ?? row.payment_method) || "Não informado",
    installment: getString(row.Parcelamento ?? row.installment),
    originalText: getString(row["Texto Original"] ?? row.originalText ?? row.original_text),
  };
}

export function normalizeTransactions(rows: RawTransaction[]): Transaction[] {
  return rows.map(mapTransaction).filter((transaction) => transaction.date && transaction.amount > 0);
}
