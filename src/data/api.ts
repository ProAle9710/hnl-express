import { auth } from "@/firebase/client";

function baseUrl(): string {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!value) throw new Error("Falta EXPO_PUBLIC_API_URL.");
  return value.replace(/\/$/, "");
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sesión no iniciada.");
  const token = await user.getIdToken();
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : `Error ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}
