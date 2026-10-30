import { api } from "@/data/api";

export type ClientRecord = {
  id: string;
  name: string;
  phone: string;
  note: string;
  tag: string;
  vip: boolean;
  createdAt: string;
};

export type Operacion = {
  montoCliente: number | null;
  valorCop: number | null;
  pagoCliente: number | null;
  costoReal: number | null;
  payMethod: string;
  tasa: string;
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
  payMethod: string;
  unitCost: number | null;
  unitCostCurrency: string;
  volumeBand: string;
  tag: string;
  operaciones: Operacion[];
};

export type ClientInput = {
  name: string;
  phone: string;
  note: string;
  tag: string;
  vip: boolean;
};

export type TxInput = Omit<TxRecord, "id" | "createdAt">;

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
    tag: text(row.tag),
    vip: row.vip === true,
    createdAt: row.createdAt,
  };
}

function asOperacion(value: unknown): Operacion | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    montoCliente: money(row.montoCliente),
    valorCop: money(row.valorCop),
    pagoCliente: money(row.pagoCliente),
    costoReal: money(row.costoReal),
    payMethod: text(row.payMethod),
    tasa: text(row.tasa),
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
    payMethod: text(row.payMethod),
    unitCost: money(row.unitCost),
    unitCostCurrency: text(row.unitCostCurrency),
    volumeBand: text(row.volumeBand),
    tag: text(row.tag),
    operaciones: Array.isArray(row.operaciones)
      ? row.operaciones.flatMap((item) => {
          const parsed = asOperacion(item);
          return parsed ? [parsed] : [];
        })
      : [],
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

export async function createClient(input: ClientInput): Promise<void> {
  await api("/api/clients", { method: "POST", body: JSON.stringify(input) });
}

export async function updateClient(id: string, input: ClientInput): Promise<void> {
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

export async function createTransaction(input: TxInput): Promise<void> {
  await api("/api/transactions", { method: "POST", body: JSON.stringify(input) });
}

export async function updateTransaction(id: string, input: TxInput): Promise<void> {
  await api(`/api/transactions/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function removeTransaction(id: string): Promise<void> {
  await api(`/api/transactions/${id}`, { method: "DELETE" });
}
