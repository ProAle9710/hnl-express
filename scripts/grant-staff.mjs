import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const envFile = readFileSync(new URL("../.env", import.meta.url), "utf8");
for (const line of envFile.split(/\r?\n/)) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const index = line.indexOf("=");
  const key = line.slice(0, index).trim();
  let value = line.slice(index + 1).trim();
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
  process.env[key] = value.replaceAll("\\n", "\n");
}

const email = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] === "admin" ? "admin" : "operator";
if (!email || !password) {
  throw new Error("Uso: node scripts/grant-staff.mjs correo contraseña admin|operator");
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Faltan FIREBASE_ADMIN_* en .env");
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const user = await getAuth()
  .getUserByEmail(email)
  .catch(async (error) => {
    if (error && typeof error === "object" && "code" in error && error.code === "auth/user-not-found") {
      return getAuth().createUser({ email, password });
    }
    throw error;
  });

await getFirestore().doc(`staff/${user.uid}`).set({
  email,
  role,
  active: true,
});

console.log(`Habilitado ${email} como ${role}`);
