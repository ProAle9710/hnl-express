/** Máscara en vivo: 1000 → 1,000 ; 1000.5 → 1,000.5 */
export function maskAmount(raw: string): string {
  const cleaned = raw.replace(/[^0-9.,]/g, "");
  if (!cleaned) return "";
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  const decimalAt = lastDot >= 0 ? lastDot : lastComma >= 0 && cleaned.slice(lastComma + 1).replace(/\D/g, "").length <= 2 && lastComma === cleaned.indexOf(",") ? lastComma : -1;
  let intDigits: string;
  let decDigits = "";
  let keepDecimal = false;
  if (decimalAt >= 0) {
    intDigits = cleaned.slice(0, decimalAt).replace(/\D/g, "");
    decDigits = cleaned.slice(decimalAt + 1).replace(/\D/g, "").slice(0, 2);
    keepDecimal = true;
  } else {
    intDigits = cleaned.replace(/\D/g, "");
  }
  intDigits = intDigits.replace(/^0+(?=\d)/, "").slice(0, 12);
  if (!intDigits && (keepDecimal || cleaned === "0")) intDigits = "0";
  if (!intDigits) return keepDecimal ? "0." + decDigits : "";
  const grouped = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (!keepDecimal) return grouped;
  return decDigits ? `${grouped}.${decDigits}` : `${grouped}.`;
}

export function parseAmount(raw: string): number | null {
  let normalized = raw.trim().replace(/\s/g, "");
  if (normalized.includes(",") && normalized.includes(".")) normalized = normalized.replace(/,/g, "");
  else if (/^\d{1,3}(,\d{3})+$/.test(normalized)) normalized = normalized.replace(/,/g, "");
  else normalized = normalized.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return value;
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A centésimas: .26 o más sube la décima; .25 o menos la deja. */
export function roundGain(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const cents = Math.round(Math.abs(value) * 100);
  let tenths = Math.floor(cents / 10);
  if (cents % 10 >= 6) tenths += 1;
  return (sign * tenths) / 10;
}

export function formatCop(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function localDayKey(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayKey(now = new Date()): string {
  return localDayKey(now.toISOString());
}

export function monthKey(iso: string): string {
  return localDayKey(iso).slice(0, 7);
}

export function weekKey(iso: string): string {
  const date = new Date(iso);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return localDayKey(date.toISOString());
}
