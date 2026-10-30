export const PAY_METHODS = [
  { id: "Zelle (Selly)", label: "Zelle (Selly)", currency: "USD" },
  { id: "USD Efectivo", label: "USD Efectivo", currency: "USD" },
  { id: "USD Tarjeta", label: "USD Tarjeta", currency: "USD" },
  { id: "COP Transferencia", label: "COP Transferencia", currency: "COP" },
] as const;

export const RATE_OPTIONS = [
  { id: "", label: "Sin tasa" },
  { id: "8", label: "8%" },
  { id: "6", label: "6%" },
  { id: "custom", label: "Personalizada" },
] as const;

export const STATUS_TAGS = ["Pago pendiente", "Seguimiento", "Negocio finalizado", "Deuda"] as const;

export const VOLUME_BANDS = [
  { id: "", label: "Sin rango" },
  { id: "lt75", label: "Menos de 75 USD" },
  { id: "75_150", label: "75 a 150 USD" },
  { id: "gt150", label: "Más de 150 USD" },
  { id: "cop1m", label: "1 millón de pesos+" },
] as const;

export type PayMethodId = (typeof PAY_METHODS)[number]["id"];
