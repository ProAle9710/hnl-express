export type ReceiptDraft = {
  destinationAccount: string;
  amount: string;
  currency: string;
  transactionId: string;
};

export type LedgerEntry = {
  id: string;
  createdAt: string;
  charged: number;
  cost: number;
  currency: string;
  usdRate: number;
  profitUsd: number;
  transactionId: string;
};

export type ProfitPrefill = {
  charged?: string;
  currency?: string;
  transactionId?: string;
};
