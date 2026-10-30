export const PAY_METHODS = [
  { id: "USD", label: "USD", currency: "USD" },
  { id: "COP", label: "Pesos colombianos", currency: "COP" },
  { id: "Zelle", label: "Zelle", currency: "USD" },
  { id: "USDT", label: "USDT", currency: "USD" },
  { id: "CUP", label: "Pesos cubanos", currency: "CUP" },
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
