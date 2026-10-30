import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useSession } from "@/auth/session";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Screen } from "@/components/Screen";
import { Select } from "@/components/Select";
import { Sheet } from "@/components/Sheet";
import { STATUS_TAGS } from "@/data/catalog";
import {
  createClient,
  listClients,
  listTransactions,
  removeClient,
  removeTransaction,
  updateClient,
  updateTransaction,
  type ClientRecord,
  type TxRecord,
} from "@/data/records";
import { formatUsd, monthKey, roundMoney } from "@/money";
import { hig, type } from "@/theme";

const tagOptions = [{ id: "", label: "Sin etiqueta" }, ...STATUS_TAGS.map((tag) => ({ id: tag, label: tag }))];

export function ClientsScreen() {
  const { staff, clientId, setClientId } = useSession();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [filter, setFilter] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");
  const [vip, setVip] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTx, setEditTx] = useState<TxRecord | null>(null);
  const [txTag, setTxTag] = useState("");
  const [txCharged, setTxCharged] = useState("");
  const [txCost, setTxCost] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ kind: "client" | "tx"; id: string; label: string } | null>(
    null,
  );

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
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.phone.toLowerCase().includes(term) ||
        client.tag.toLowerCase().includes(term),
    );
  }, [clients, filter]);

  const selectedTx = transactions.filter((row) => row.clientId === clientId);
  const month = monthKey(new Date().toISOString());
  const monthTx = selectedTx.filter((row) => monthKey(row.createdAt) === month && row.kind === "profit");
  const monthCount = monthTx.length;
  const monthSent = roundMoney(monthTx.reduce((sum, row) => sum + (row.charged ?? (Number(row.amount) || 0)), 0));
  const monthProfit = roundMoney(monthTx.reduce((sum, row) => sum + (row.profitUsd ?? 0), 0));
  const admin = staff?.role === "admin";
  const selected = clients.find((client) => client.id === clientId);

  function beginEdit(client: ClientRecord) {
    setEditing(client.id);
    setClientId(client.id);
    setName(client.name);
    setPhone(client.phone);
    setNote(client.note);
    setTag(client.tag);
    setVip(client.vip);
    setFormOpen(true);
  }

  function beginCreate() {
    setEditing(null);
    setName("");
    setPhone("");
    setNote("");
    setTag("");
    setVip(false);
    setFormOpen(true);
  }

  async function save() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const input = { name, phone, note, tag, vip };
      if (editing) await updateClient(editing, input);
      else await createClient(input);
      setFormOpen(false);
      setEditing(null);
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

  async function saveTx() {
    if (!editTx) return;
    const charged = Number(txCharged);
    const cost = Number(txCost);
    if (!Number.isFinite(charged) || !Number.isFinite(cost) || editTx.usdRate == null) return;
    const profitUsd = Math.round((charged - cost) * editTx.usdRate * 100) / 100;
    setBusy(true);
    try {
      const { id: _id, createdAt: _createdAt, ...rest } = editTx;
      await updateTransaction(editTx.id, {
        ...rest,
        charged,
        cost,
        profitUsd,
        tag: txTag,
        amount: String(charged),
      });
      setEditTx(null);
      await reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo corregir la operación.");
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
              <View style={styles.nameRow}>
                {client.vip ? <Ionicons name="star" size={16} color={hig.yellow} /> : null}
                <Text style={styles.name}>{client.name}</Text>
              </View>
              <Text style={styles.meta}>
                {client.phone || "Sin teléfono"}
                {client.tag ? ` · ${client.tag}` : ""}
              </Text>
            </View>
            {admin ? (
              <Pressable
                disabled={busy}
                onPress={() => setPendingDelete({ kind: "client", id: client.id, label: client.name })}
                style={styles.dangerHit}
              >
                <Text style={styles.danger}>Borrar</Text>
              </Pressable>
            ) : null}
          </Pressable>
        ))}
        {selected ? (
          <View style={styles.tiles}>
            <View style={styles.tile}>
              <Text style={styles.meta}>Envíos</Text>
              <Text style={styles.name}>{monthCount}</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.meta}>Ganancia</Text>
              <Text style={styles.name}>{formatUsd(monthProfit)}</Text>
            </View>
            <View style={styles.tile}>
              <Text style={styles.meta}>Enviado</Text>
              <Text style={styles.name}>{formatUsd(monthSent)}</Text>
            </View>
          </View>
        ) : null}
        {selectedTx.length > 0 ? <Text style={styles.section}>Operaciones</Text> : null}
        {selectedTx.map((row) => (
          <Pressable
            key={row.id}
            style={styles.row}
            onPress={() => {
              setEditTx(row);
              setTxTag(row.tag);
              setTxCharged(row.charged == null ? "" : String(row.charged));
              setTxCost(row.cost == null ? "" : String(row.cost));
            }}
          >
            <View style={styles.rowText}>
              <Text style={styles.name}>{row.kind === "profit" ? "Ganancia" : "Comprobante"}</Text>
              <Text style={styles.meta}>
                {row.transactionId || row.amount} {row.currency} {row.profitUsd == null ? "" : formatUsd(row.profitUsd)}
                {row.tag ? ` · ${row.tag}` : ""}
              </Text>
            </View>
            {admin ? (
              <Pressable
                disabled={busy}
                onPress={() =>
                  setPendingDelete({
                    kind: "tx",
                    id: row.id,
                    label: row.transactionId || row.amount,
                  })
                }
                style={styles.dangerHit}
              >
                <Text style={styles.danger}>Borrar</Text>
              </Pressable>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
      <Sheet visible={formOpen} onDismiss={() => setFormOpen(false)} title={editing ? "Editar cliente" : "Nuevo cliente"}>
        <Field label="Nombre" value={name} onChangeText={setName} />
        <Field label="Teléfono" value={phone} onChangeText={setPhone} />
        <Field label="Nota" value={note} onChangeText={setNote} />
        <Select label="Etiqueta" value={tag} options={tagOptions} onChange={setTag} />
        <Pressable onPress={() => setVip((current) => !current)} style={styles.vipToggle}>
          <View style={styles.vipFace}>
            <Ionicons name={vip ? "star" : "star-outline"} size={18} color={hig.yellow} />
            <Text style={styles.name}>{vip ? "Cliente VIP" : "Marcar VIP"}</Text>
          </View>
        </Pressable>
        <Button
          label={editing ? "Guardar cambios" : "Crear cliente"}
          disabled={!name.trim() || busy}
          onPress={() => void save()}
        />
      </Sheet>
      <Sheet visible={editTx != null} onDismiss={() => setEditTx(null)} title="Corregir operación">
        <Field label="Cobrado" value={txCharged} keyboardType="decimal-pad" onChangeText={setTxCharged} />
        <Field label="Costo" value={txCost} keyboardType="decimal-pad" onChangeText={setTxCost} />
        <Select label="Etiqueta" value={txTag} options={tagOptions} onChange={setTxTag} />
        <Button label="Guardar corrección" disabled={busy} onPress={() => void saveTx()} />
      </Sheet>
      <Sheet visible={pendingDelete != null} onDismiss={() => setPendingDelete(null)} title="Confirmar borrado">
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
  row: {
    minHeight: hig.hit,
    backgroundColor: hig.cell,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: type.headline,
  meta: type.footnote,
  section: { ...type.headline, marginTop: 12 },
  tiles: { flexDirection: "row", gap: 8, marginTop: 8 },
  tile: {
    flex: 1,
    backgroundColor: hig.cell,
    borderRadius: 14,
    padding: 10,
    minHeight: 64,
    justifyContent: "center",
  },
  dangerHit: { minHeight: hig.hit, justifyContent: "center", paddingHorizontal: 8 },
  danger: { ...type.footnote, color: hig.red, fontWeight: "600" },
  error: { ...type.footnote, color: hig.red },
  vipToggle: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  vipFace: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: hig.fill,
  },
});
