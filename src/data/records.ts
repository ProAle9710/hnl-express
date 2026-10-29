import { api } from "@/data/api";

export type ClientRecord = {
  id: string;
  name: string;
  phone: string;
  note: string;
  createdAt: string;
};

export type TxKind = "receipt" | "profit";

export type TxRecord = {
  id: string;
  clientId: string;
  kind: TxKind;
  createdAt: string;
  destinationAccount: string;
  amount: string;
  currency: string;
  transactionId: string;
  charged: number | null;
  cost: number | null;
  usdRate: number | null;
  profitUsd: number | null;
};

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function money(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asClient(id: string, value: unknown): ClientRecord {
  if (!value || typeof value !== "object") throw new Error(`Cliente dañado: ${id}`);
  const row = value as Record<string, unknown>;
  if (typeof row.name !== "string" || typeof row.createdAt !== "string") {
    throw new Error(`Cliente dañado: ${id}`);
  }
  return {
    id,
    name: row.name,
    phone: text(row.phone),
    note: text(row.note),
    createdAt: row.createdAt,
  };
}

function asTx(id: string, value: unknown): TxRecord {
  if (!value || typeof value !== "object") throw new Error(`Transacción dañada: ${id}`);
  const row = value as Record<string, unknown>;
  if (
    typeof row.clientId !== "string" ||
    (row.kind !== "receipt" && row.kind !== "profit") ||
    typeof row.createdAt !== "string"
  ) {
    throw new Error(`Transacción dañada: ${id}`);
  }
  return {
    id,
    clientId: row.clientId,
    kind: row.kind,
    createdAt: row.createdAt,
    destinationAccount: text(row.destinationAccount),
    amount: text(row.amount),
    currency: text(row.currency),
    transactionId: text(row.transactionId),
    charged: money(row.charged),
    cost: money(row.cost),
    usdRate: money(row.usdRate),
    profitUsd: money(row.profitUsd),
  };
}

export async function listClients(): Promise<ClientRecord[]> {
  const rows = await api<unknown[]>("/api/clients");
  return rows.map((row) => {
    if (!row || typeof row !== "object" || !("id" in row) || typeof row.id !== "string") {
      throw new Error("Cliente dañado.");
    }
    return asClient(row.id, row);
  });
}

export async function createClient(input: { name: string; phone: string; note: string }): Promise<void> {
  await api("/api/clients", { method: "POST", body: JSON.stringify(input) });
}

export async function updateClient(
  id: string,
  input: { name: string; phone: string; note: string },
): Promise<void> {
  await api(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function removeClient(id: string): Promise<void> {
  await api(`/api/clients/${id}`, { method: "DELETE" });
}

export async function listTransactions(): Promise<TxRecord[]> {
  const rows = await api<unknown[]>("/api/transactions");
  return rows.map((row) => {
    if (!row || typeof row !== "object" || !("id" in row) || typeof row.id !== "string") {
      throw new Error("Transacción dañada.");
    }
    return asTx(row.id, row);
  });
}

export async function createTransaction(input: Omit<TxRecord, "id" | "createdAt">): Promise<void> {
  await api("/api/transactions", { method: "POST", body: JSON.stringify(input) });
}

export async function removeTransaction(id: string): Promise<void> {
  await api(`/api/transactions/${id}`, { method: "DELETE" });
}
