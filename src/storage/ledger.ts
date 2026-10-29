import AsyncStorage from "@react-native-async-storage/async-storage";

import { localDayKey } from "@/money";
import type { LedgerEntry } from "@/types";

const KEY = "hnl.ledger.v1";

function isEntry(value: unknown): value is LedgerEntry {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.createdAt === "string" &&
    typeof row.charged === "number" &&
    typeof row.cost === "number" &&
    typeof row.currency === "string" &&
    typeof row.usdRate === "number" &&
    typeof row.profitUsd === "number" &&
    typeof row.transactionId === "string"
  );
}

export async function loadLedger(): Promise<LedgerEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw == null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error("El historial local no se pudo leer.", { cause: error });
  }
  if (!Array.isArray(parsed) || !parsed.every(isEntry)) {
    throw new Error("El historial local está dañado.");
  }
  return parsed;
}

export async function saveEntry(entry: LedgerEntry): Promise<LedgerEntry[]> {
  const current = await loadLedger();
  const next = [entry, ...current];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function entriesForDay(entries: LedgerEntry[], day: string): LedgerEntry[] {
  return entries.filter((entry) => localDayKey(entry.createdAt) === day);
}
