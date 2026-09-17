import type { RawTransaction, Transaction } from "@/types/transaction";

const field = (row: RawTransaction, names: string[]): unknown => {
  for (const name of names) {
    if (name in row) return row[name];
  }
  return undefined;
};

const getString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const getNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? Math.abs(value) : 0;

  const raw = getString(value).replace(/[^0-9,.-]/g, "");
  if (!raw) return 0;

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : lastDot > lastComma ? "." : "";
  const normalized = decimalSeparator
    ? raw.replace(/[.,]/g, (separator) => separator === decimalSeparator ? "." : "")
    : raw;
  const amount = Number(normalized);

  return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

const isValidDate = (year: number, month: number, day: number): boolean => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const formatDate = (year: string, month: string, day: string): string => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);

  return isValidDate(numericYear, numericMonth, numericDay) ? `${year}-${month}-${day}` : "";
};

const normalizeDate = (value: unknown): string => {
  const date = getString(value);
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(date);
  if (isoDate) return formatDate(isoDate[1], isoDate[2], isoDate[3]);

  const brazilianDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (brazilianDate) return formatDate(brazilianDate[3], brazilianDate[2], brazilianDate[1]);

  return "";
};

const normalizeType = (value: unknown): Transaction["type"] => {
  const type = getString(value).toLocaleLowerCase("pt-BR");
  return type === "income" || type === "receita" ? "income" : "expense";
};

export function mapTransaction(row: RawTransaction): Transaction {
  return {
    date: normalizeDate(field(row, ["Data", "data", "date"])),
    time: getString(field(row, ["Hora", "hora", "time"])),
    type: normalizeType(field(row, ["Tipo", "tipo", "type"])),
    category: getString(field(row, ["Categoria", "categoria", "category"])) || "Sem categoria",
    description: getString(field(row, ["Descrição", "Descricao", "descrição", "descricao", "description"])) || "Sem descrição",
    amount: getNumber(field(row, ["Valor", "valor", "amount"])),
    account: getString(field(row, ["Conta", "conta", "account"])) || "Não informada",
    paymentMethod: getString(field(row, ["Pagamento", "pagamento", "Forma de Pagamento", "paymentMethod", "payment_method"])) || "Não informado",
    installment: getString(field(row, [
      "Parcelamento",
      "parcelamento",
      "Parcela",
      "parcela",
      "Parcelas",
      "parcelas",
      "Quantidade de parcelas",
      "quantidade de parcelas",
      "Número de parcelas",
      "numero de parcelas",
      "installment",
    ])),
    originalText: getString(field(row, ["Texto Original", "texto original", "textoOriginal", "originalText", "original_text"])),
  };
}

export function normalizeTransactions(rows: RawTransaction[]): Transaction[] {
  return rows.map(mapTransaction).filter((transaction) => transaction.date && transaction.amount > 0);
}
