import type { ReceiptDraft } from "@/types";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function receiptHtml(draft: ReceiptDraft, issuedAt: Date): string {
  const when = issuedAt.toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif; margin: 0; color: #1c1c1e; }
    .sheet { max-width: 420px; margin: 24px auto; padding: 28px 24px 20px; border: 1px solid #d1d1d6; border-radius: 16px; }
    .brand { font-size: 28px; font-weight: 700; letter-spacing: -0.4px; }
    .mark { color: #007AFF; }
    .muted { color: #636366; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    td { padding: 10px 0; border-bottom: 1px solid #e5e5ea; font-size: 15px; vertical-align: top; }
    td.k { color: #636366; width: 46%; }
    .amount { font-size: 32px; font-weight: 700; margin: 18px 0 0; }
    footer { margin-top: 28px; text-align: center; font-size: 13px; color: #636366; }
  </style>
</head>
<body>
  <article class="sheet">
    <div class="brand">HN <span class="mark">Xpress</span></div>
    <div class="muted">Comprobante de operación</div>
    <div class="amount">${escapeHtml(draft.amount)} ${escapeHtml(draft.currency)}</div>
    <table>
      <tr><td class="k">Cuenta destino</td><td>${escapeHtml(draft.destinationAccount)}</td></tr>
      <tr><td class="k">Moneda</td><td>${escapeHtml(draft.currency)}</td></tr>
      <tr><td class="k">ID transacción</td><td>${escapeHtml(draft.transactionId)}</td></tr>
      <tr><td class="k">Emitido</td><td>${escapeHtml(when)}</td></tr>
    </table>
    <footer>Gracias por confiar en nosotros</footer>
  </article>
</body>
</html>`;
}
