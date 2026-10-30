import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getAuth, getFirestore, initAdmin } from "./admin.mjs";
import { publishIndexes, publishRules } from "./bootstrap.mjs";
import { loadEnv } from "./env.mjs";
import { seedInitialAdmin } from "./seed.mjs";

loadEnv();
initAdmin();
await publishRules();
await publishIndexes();
await seedInitialAdmin();

const db = getFirestore();
const webRoot = resolve(process.env.WEB_ROOT ?? fileURLToPath(new URL("../dist", import.meta.url)));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function cacheControl(file) {
  const name = file.replaceAll("\\", "/");
  const ext = extname(file);
  if (ext === ".html" || name.endsWith("/index.html")) return "no-cache";
  if (/\.[0-9a-f]{8,}\./i.test(name) || name.includes("/_expo/static/") || name.includes("/assets/")) {
    return "public, max-age=31536000, immutable";
  }
  if (ext === ".png" || ext === ".ico" || ext === ".ttf" || ext === ".woff2" || ext === ".js" || ext === ".css") {
    return "public, max-age=86400";
  }
  return "no-cache";
}

function serveWeb(request, response, pathname) {
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let file = resolve(webRoot, relative);
  if (!file.startsWith(webRoot) || !existsSync(file) || !statSync(file).isFile()) {
    file = join(webRoot, "index.html");
  }
  if (!existsSync(file)) return false;
  response.writeHead(200, {
    "Content-Type": types[extname(file)] ?? "application/octet-stream",
    "Cache-Control": cacheControl(file),
  });
  if (request.method === "HEAD") {
    response.end();
    return true;
  }
  createReadStream(file).pipe(response);
  return true;
}
const allowedOrigins = new Set([
  "https://asdf-883-qwez.duckdns.org",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:19006",
]);

function send(response, status, body, origin) {
  const headers = { "Content-Type": "application/json" };
  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
    headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS";
    headers.Vary = "Origin";
  }
  response.writeHead(status, headers);
  response.end(body == null ? "" : JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON inválido.");
  }
  return parsed;
}

function textField(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function numberField(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clientFields(body) {
  return {
    name: textField(body.name, 120),
    phone: textField(body.phone, 40),
    note: textField(body.note, 500),
    tag: textField(body.tag, 40),
    vip: body.vip === true,
  };
}

function txFields(body) {
  return {
    destinationAccount: textField(body.destinationAccount, 120),
    amount: textField(body.amount, 40),
    currency: textField(body.currency, 12),
    transactionId: textField(body.transactionId, 80),
    charged: numberField(body.charged),
    cost: numberField(body.cost),
    usdRate: numberField(body.usdRate),
    profitUsd: numberField(body.profitUsd),
    payMethod: textField(body.payMethod, 24),
    unitCost: numberField(body.unitCost),
    unitCostCurrency: textField(body.unitCostCurrency, 8),
    volumeBand: textField(body.volumeBand, 24),
    tag: textField(body.tag, 40),
  };
}

async function staffOf(request) {
  const header = request.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const decoded = await getAuth().verifyIdToken(token);
  const snap = await db.doc(`staff/${decoded.uid}`).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data || data.active !== true || (data.role !== "admin" && data.role !== "operator")) return null;
  return { uid: decoded.uid, email: String(data.email ?? decoded.email ?? ""), role: data.role };
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (request.method === "OPTIONS") {
    send(response, 204, null, typeof origin === "string" ? origin : undefined);
    return;
  }
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const cors = typeof origin === "string" ? origin : undefined;
  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      send(response, 200, { ok: true }, cors);
      return;
    }
    if (!url.pathname.startsWith("/api") && (request.method === "GET" || request.method === "HEAD") && serveWeb(request, response, url.pathname)) {
      return;
    }
    const staff = await staffOf(request);
    if (!staff) {
      send(response, 401, { error: "No autorizado." }, cors);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/me") {
      send(response, 200, { email: staff.email, role: staff.role, active: true }, cors);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/clients") {
      const snap = await db.collection("clients").orderBy("name").get();
      send(response, 200, snap.docs.map((item) => ({ id: item.id, ...item.data() })), cors);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/clients") {
      const body = await readJson(request);
      const fields = clientFields(body);
      if (!fields.name) {
        send(response, 400, { error: "Nombre requerido." }, cors);
        return;
      }
      const ref = await db.collection("clients").add({
        ...fields,
        createdAt: new Date().toISOString(),
      });
      send(response, 201, { id: ref.id }, cors);
      return;
    }
    const clientMatch = url.pathname.match(/^\/api\/clients\/([^/]+)$/);
    if (clientMatch && request.method === "PATCH") {
      const body = await readJson(request);
      const fields = clientFields(body);
      if (!fields.name) {
        send(response, 400, { error: "Nombre requerido." }, cors);
        return;
      }
      await db.doc(`clients/${clientMatch[1]}`).update(fields);
      send(response, 204, null, cors);
      return;
    }
    if (clientMatch && request.method === "DELETE") {
      if (staff.role !== "admin") {
        send(response, 403, { error: "Solo un administrador puede borrar." }, cors);
        return;
      }
      await db.doc(`clients/${clientMatch[1]}`).delete();
      send(response, 204, null, cors);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/transactions") {
      const clientId = url.searchParams.get("clientId");
      const query = clientId
        ? db.collection("transactions").where("clientId", "==", clientId).orderBy("createdAt", "desc")
        : db.collection("transactions").orderBy("createdAt", "desc");
      const snap = await query.limit(300).get();
      send(response, 200, snap.docs.map((item) => ({ id: item.id, ...item.data() })), cors);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/transactions") {
      const body = await readJson(request);
      const clientId = textField(body.clientId, 128);
      if (!clientId || (body.kind !== "receipt" && body.kind !== "profit")) {
        send(response, 400, { error: "Transacción inválida." }, cors);
        return;
      }
      const ref = await db.collection("transactions").add({
        clientId,
        kind: body.kind,
        createdAt: new Date().toISOString(),
        ...txFields(body),
        createdBy: staff.uid,
      });
      send(response, 201, { id: ref.id }, cors);
      return;
    }
    const txMatch = url.pathname.match(/^\/api\/transactions\/([^/]+)$/);
    if (txMatch && request.method === "PATCH") {
      const body = await readJson(request);
      const clientId = textField(body.clientId, 128);
      if (!clientId || (body.kind !== "receipt" && body.kind !== "profit")) {
        send(response, 400, { error: "Transacción inválida." }, cors);
        return;
      }
      await db.doc(`transactions/${txMatch[1]}`).update({
        clientId,
        kind: body.kind,
        ...txFields(body),
        updatedAt: new Date().toISOString(),
        updatedBy: staff.uid,
      });
      send(response, 204, null, cors);
      return;
    }
    if (txMatch && request.method === "DELETE") {
      if (staff.role !== "admin") {
        send(response, 403, { error: "Solo un administrador puede borrar." }, cors);
        return;
      }
      await db.doc(`transactions/${txMatch[1]}`).delete();
      send(response, 204, null, cors);
      return;
    }
    send(response, 404, { error: "No encontrado." }, cors);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno.";
    send(response, 500, { error: message }, cors);
  }
});

const port = Number(process.env.PORT ?? 8787);
server.listen(port, "127.0.0.1", () => {
  console.log(`BFF en http://127.0.0.1:${port} sirviendo ${webRoot}`);
});
