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

export interface TransactionsResponse {
  ok: boolean;
  transactions?: RawTransaction[];
  error?: string;
}
