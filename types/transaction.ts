export type TransactionType = "expense" | "income";

export interface Transaction {
  date: string;
  time: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  account: string;
  paymentMethod: string;
  installment: string;
  originalText: string;
}

export type RawTransaction = Record<string, unknown>;

export interface AppsScriptTransactionsResponse {
  ok: boolean;
  transactions?: RawTransaction[];
  error?: string;
}

export interface TransactionsApiResponse {
  ok: boolean;
  transactions?: Transaction[];
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasResponseShape(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.ok === "boolean" &&
    (value.error === undefined || typeof value.error === "string");
}

export function isAppsScriptTransactionsResponse(value: unknown): value is AppsScriptTransactionsResponse {
  return hasResponseShape(value) &&
    (value.transactions === undefined ||
      (Array.isArray(value.transactions) && value.transactions.every(isRecord)));
}

function isTransaction(value: unknown): value is Transaction {
  return isRecord(value) &&
    typeof value.date === "string" &&
    typeof value.time === "string" &&
    (value.type === "expense" || value.type === "income") &&
    typeof value.category === "string" &&
    typeof value.description === "string" &&
    typeof value.amount === "number" &&
    typeof value.account === "string" &&
    typeof value.paymentMethod === "string" &&
    typeof value.installment === "string" &&
    typeof value.originalText === "string";
}

export function isTransactionsApiResponse(value: unknown): value is TransactionsApiResponse {
  return hasResponseShape(value) &&
    (value.transactions === undefined ||
      (Array.isArray(value.transactions) && value.transactions.every(isTransaction)));
}
