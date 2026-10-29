import type { ReceiptDraft } from "@/types";

export class VisionConfigError extends Error {
  constructor() {
    super("Configura EXPO_PUBLIC_VISION_API_URL para extraer datos del comprobante.");
    this.name = "VisionConfigError";
  }
}

type VisionPayload = {
  destinationAccount: string;
  amount: number | string;
  currency: string;
  transactionId: string;
};

function isPayload(value: unknown): value is VisionPayload {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.destinationAccount === "string" &&
    (typeof row.amount === "number" || typeof row.amount === "string") &&
    typeof row.currency === "string" &&
    typeof row.transactionId === "string"
  );
}

export async function extractReceipt(
  imageBase64: string,
  mimeType: string,
): Promise<ReceiptDraft> {
  const url = process.env.EXPO_PUBLIC_VISION_API_URL?.trim();
  if (!url) throw new VisionConfigError();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = process.env.EXPO_PUBLIC_VISION_API_KEY?.trim();
  if (key) headers.Authorization = `Bearer ${key}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ imageBase64, mimeType }),
    });
  } catch (error) {
    throw new Error("No se pudo contactar el servicio de visión.", { cause: error });
  }

  if (!response.ok) {
    throw new Error(`El servicio de visión respondió ${response.status}.`);
  }

  let body: unknown;
  try {
    body = (await response.json()) as unknown;
  } catch (error) {
    throw new Error("La respuesta de visión no es JSON.", { cause: error });
  }

  if (!isPayload(body)) {
    throw new Error("La respuesta de visión no trae los campos requeridos.");
  }

  return {
    destinationAccount: body.destinationAccount,
    amount: String(body.amount),
    currency: body.currency.toUpperCase(),
    transactionId: body.transactionId,
  };
}
