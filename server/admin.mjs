import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function initAdmin() {
  if (getApps().length > 0) return;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Faltan FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL o FIREBASE_ADMIN_PRIVATE_KEY.");
  }
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function projectId() {
  const id = process.env.FIREBASE_ADMIN_PROJECT_ID;
  if (!id) throw new Error("Falta FIREBASE_ADMIN_PROJECT_ID.");
  return id;
}

export async function accessToken() {
  const credential = getApps()[0]?.options.credential;
  if (!credential) throw new Error("Admin SDK sin credencial.");
  const token = await credential.getAccessToken();
  return token.access_token;
}

export { getAuth, getFirestore };
