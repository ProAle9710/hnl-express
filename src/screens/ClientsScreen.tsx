import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { signOut } from "firebase/auth";

import { useSession } from "@/auth/session";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Screen } from "@/components/Screen";
import { Sheet } from "@/components/Sheet";
import {
  createClient,
  listClients,
  listTransactions,
  removeClient,
  removeTransaction,
  updateClient,
  type ClientRecord,
  type TxRecord,
} from "@/data/records";
import { auth } from "@/firebase/client";
import { formatUsd } from "@/money";
import { hig, type } from "@/theme";

export function ClientsScreen() {
  const { staff, clientId, setClientId } = useSession();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [filter, setFilter] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ kind: "client" | "tx"; id: string; label: string } | null>(null);

  const reload = useCallback(() => {
    return Promise.all([listClients(), listTransactions()])
      .then(([nextClients, nextTx]) => {
        setClients(nextClients);
        setTransactions(nextTx);
        setError("");
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "No se pudieron leer los datos.");
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((client) => client.name.toLowerCase().includes(term));
  }, [clients, filter]);

  const selectedTx = transactions.filter((row) => row.clientId === clientId);
  const admin = staff?.role === "admin";

  function beginEdit(client: ClientRecord) {
    setEditing(client.id);
    setClientId(client.id);
    setName(client.name);
    setPhone(client.phone);
    setNote(client.note);
    setFormOpen(true);
  }

  function beginCreate() {
    setEditing(null);
    setName("");
    setPhone("");
    setNote("");
    setFormOpen(true);
  }

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const input = { name, phone, note };
      if (editing) await updateClient(editing, input);
      else await createClient(input);
      setName("");
      setPhone("");
      setNote("");
      setEditing(null);
      setFormOpen(false);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el cliente.");
    } finally {
      setBusy(false);
    }
  }

  async function destroyClient(id: string) {
    setBusy(true);
    try {
      await removeClient(id);
      if (clientId === id) setClientId(null);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo borrar el cliente.");
    } finally {
      setBusy(false);
    }
  }

  async function destroyTx(id: string) {
    setBusy(true);
    try {
      await removeTransaction(id);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo borrar la transacción.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Clientes" subtitle={staff?.role === "admin" ? "Administrador" : "Operador"}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Field label="Buscar" value={filter} onChangeText={setFilter} />
        <Button label="Nuevo cliente" onPress={beginCreate} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {visible.map((client) => (
          <Pressable key={client.id} onPress={() => beginEdit(client)} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.name}>{client.name}</Text>
              <Text style={styles.meta}>{client.phone || "Sin teléfono"}</Text>
            </View>
            {admin ? (
              <Button
                label="Borrar"
                tone="plain"
                disabled={busy}
                onPress={() => setPendingDelete({ kind: "client", id: client.id, label: client.name })}
              />
            ) : null}
          </Pressable>
        ))}
        <Text style={styles.section}>
          Transacciones {selectedTx.length === 0 ? "" : `(${selectedTx.length})`}
        </Text>
        {selectedTx.map((row) => (
          <View key={row.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.name}>{row.kind === "profit" ? "Ganancia" : "Comprobante"}</Text>
              <Text style={styles.meta}>
                {row.transactionId || row.amount} {row.currency} {row.profitUsd == null ? "" : formatUsd(row.profitUsd)}
              </Text>
            </View>
            {admin ? (
              <Button
                label="Borrar"
                tone="plain"
                disabled={busy}
                onPress={() =>
                  setPendingDelete({
                    kind: "tx",
                    id: row.id,
                    label: row.transactionId || row.amount,
                  })
                }
              />
            ) : null}
          </View>
        ))}
        <Button label="Salir" tone="plain" onPress={() => void signOut(auth)} />
      </ScrollView>
      <Sheet visible={formOpen} onDismiss={() => setFormOpen(false)} title={editing ? "Editar cliente" : "Nuevo cliente"}>
        <Field label="Nombre" value={name} onChangeText={setName} />
        <Field label="Teléfono" value={phone} onChangeText={setPhone} />
        <Field label="Nota" value={note} onChangeText={setNote} />
        <Button
          label={editing ? "Guardar cambios" : "Crear cliente"}
          disabled={!name.trim() || busy}
          onPress={() => void save()}
        />
      </Sheet>
      <Sheet
        visible={pendingDelete != null}
        onDismiss={() => setPendingDelete(null)}
        title="Confirmar borrado"
      >
        <Text style={styles.meta}>{pendingDelete?.label}</Text>
        <Button
          label="Borrar"
          disabled={busy}
          onPress={() => {
            if (!pendingDelete) return;
            const target = pendingDelete;
            setPendingDelete(null);
            if (target.kind === "client") void destroyClient(target.id);
            else void destroyTx(target.id);
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 8, paddingBottom: 32 },
  card: { backgroundColor: hig.cell, borderRadius: hig.radius, overflow: "hidden" },
  row: {
    minHeight: hig.hit,
    backgroundColor: hig.cell,
    borderRadius: hig.radius,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: { flex: 1 },
  name: type.headline,
  meta: type.footnote,
  section: { ...type.headline, marginTop: 8 },
  error: { ...type.footnote, color: hig.red },
});
