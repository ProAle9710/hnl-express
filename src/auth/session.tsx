import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { api } from "@/data/api";
import { auth } from "@/firebase/client";

export type StaffRole = "admin" | "operator";

export type StaffProfile = {
  email: string;
  role: StaffRole;
  active: boolean;
};

type SessionValue = {
  ready: boolean;
  user: User | null;
  staff: StaffProfile | null;
  error: string;
  clientId: string | null;
  setClientId: (id: string | null) => void;
};

const SessionContext = createContext<SessionValue | null>(null);

function isStaff(value: unknown): value is StaffProfile {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.email === "string" &&
    (row.role === "admin" || row.role === "operator") &&
    row.active === true
  );
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [error, setError] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      if (!next) {
        setStaff(null);
        setError("");
        setReady(true);
        return;
      }
      setReady(false);
      api<unknown>("/api/me")
        .then((data) => {
          setStaff(isStaff(data) ? data : null);
          setError("");
        })
        .catch((cause: unknown) => {
          setStaff(null);
          setError(cause instanceof Error ? cause.message : "No se pudo verificar el acceso.");
        })
        .finally(() => setReady(true));
    });
  }, []);

  const value = useMemo(
    () => ({ ready, user, staff, error, clientId, setClientId }),
    [ready, user, staff, error, clientId],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Sesión no disponible.");
  return value;
}
