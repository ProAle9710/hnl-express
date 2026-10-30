import { maskAmount, parseAmount } from "@/money";

export function keepPhone(raw: string): string {
  return raw.replace(/[^0-9+\-]/g, "").slice(0, 20);
}

export function keepMoney(raw: string): string {
  return maskAmount(raw);
}

export function keepEmail(raw: string): string {
  return raw.replace(/\s/g, "").slice(0, 120);
}

export function keepName(raw: string): string {
  return raw.replace(/[<>]/g, "").slice(0, 80);
}

export function keepNote(raw: string): string {
  return raw.slice(0, 280);
}

export function keepId(raw: string): string {
  return raw.replace(/[^A-Za-z0-9._\-]/g, "").slice(0, 64);
}

export function keepAccount(raw: string): string {
  return raw.replace(/[^A-Za-z0-9.\- ]/g, "").slice(0, 64);
}

export function keepCurrency(raw: string): string {
  return raw.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3);
}

export function keepRate(raw: string): string {
  return raw.replace(/[^0-9.,%]/g, "").slice(0, 8);
}

export function keepSearch(raw: string): string {
  return raw.slice(0, 80);
}

export function emailError(raw: string): string {
  if (!raw.trim()) return "Indica el correo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())) return "Correo inválido.";
  return "";
}

export function passwordError(raw: string): string {
  if (raw.length < 6) return "Mínimo 6 caracteres.";
  return "";
}

export function nameError(raw: string): string {
  if (raw.trim().length < 2) return "Nombre demasiado corto.";
  return "";
}

export function phoneError(raw: string): string {
  if (!raw) return "";
  if (!/^[+\-0-9]+$/.test(raw)) return "Solo +, − y números.";
  const digits = raw.replace(/[+\-]/g, "");
  if (digits.length < 7) return "Mínimo 7 dígitos.";
  if ((raw.match(/\+/g) ?? []).length > 1) return "Un solo +.";
  if (raw.includes("+") && !raw.startsWith("+")) return "El + va al inicio.";
  return "";
}

export function noteError(raw: string): string {
  if (raw.length > 280) return "Máximo 280 caracteres.";
  return "";
}

export function amountError(raw: string, label = "Monto inválido."): string {
  if (!raw.trim()) return "Indica el monto.";
  const pending = raw.endsWith(".") ? raw.slice(0, -1) : raw;
  if (parseAmount(pending) == null) return label;
  return "";
}

export function currencyError(raw: string): string {
  if (!/^[A-Z]{3}$/.test(raw.trim())) return "Código de 3 letras.";
  return "";
}

export function accountError(raw: string): string {
  if (raw.trim().length < 4) return "Cuenta demasiado corta.";
  return "";
}

export function idError(raw: string, required = false): string {
  if (!raw.trim()) return required ? "Indica el ID." : "";
  if (!/^[A-Za-z0-9._\-]+$/.test(raw.trim())) return "Solo letras, números, punto y guion.";
  return "";
}

export function rateError(raw: string): string {
  if (!raw.trim()) return "Indica la tasa.";
  if (!/^\d{1,2}([.,]\d{1,2})?%?$/.test(raw.trim())) return "Ejemplo: 7.5%";
  return "";
}
