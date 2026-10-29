import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { useSession } from "@/auth/session";
import { Screen } from "@/components/Screen";
import { listClients, listTransactions, type ClientRecord, type TxRecord } from "@/data/records";
import { formatUsd, localDayKey, roundMoney, todayKey } from "@/money";
import { hig, type } from "@/theme";

export function DayScreen() {
  const { clientId } = useSession();
  const [rows, setRows] = useState<TxRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [error, setError] = useState("");
  const day = todayKey();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([listTransactions(), listClients()])
        .then(([transactions, nextClients]) => {
          if (!active) return;
          setRows(transactions.filter((row) => localDayKey(row.createdAt) === day));
          setClients(nextClients);
          setError("");
        })
        .catch((cause: unknown) => {
          if (!active) return;
          setError(cause instanceof Error ? cause.message : "No se pudo leer Firebase.");
        });
      return () => {
        active = false;
      };
    }, [day]),
  );

  const visible = clientId ? rows.filter((row) => row.clientId === clientId) : rows;
  const total = roundMoney(
    visible.reduce((sum, row) => sum + (row.profitUsd ?? 0), 0),
  );
  const names = new Map(clients.map((client) => [client.id, client.name]));
  const groups = new Map<string, TxRecord[]>();
  for (const row of visible) {
    const bucket = groups.get(row.clientId) ?? [];
    bucket.push(row);
    groups.set(row.clientId, bucket);
  }

  return (
    <Screen title="Jornada" subtitle={clientId ? "Cliente seleccionado" : day}>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.caption}>Operaciones</Text>
          <Text style={styles.value}>{visible.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.caption}>Ganancia USD</Text>
          <Text style={styles.value}>{formatUsd(total)}</Text>
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView contentContainerStyle={styles.list}>
        {[...groups.entries()].map(([id, items]) => (
          <View key={id} style={styles.group}>
            <Text style={styles.groupTitle}>{names.get(id) ?? "Cliente"}</Text>
            {items.map((row) => (
              <Text key={row.id} style={styles.caption}>
                {row.kind === "profit" ? "Ganancia" : "Comprobante"} {row.transactionId || row.amount}{" "}
                {row.profitUsd == null ? "" : formatUsd(row.profitUsd)}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: "row", gap: 8 },
  metric: {
    flex: 1,
    backgroundColor: hig.cell,
    borderRadius: hig.radius,
    minHeight: 76,
    padding: 12,
    justifyContent: "center",
  },
  caption: type.footnote,
  value: { ...type.title2, marginTop: 2 },
  error: { ...type.footnote, color: hig.red, marginTop: 12 },
  list: { paddingTop: 12, paddingBottom: 32, gap: 8 },
  group: { backgroundColor: hig.cell, borderRadius: hig.radius, padding: 12, gap: 4 },
  groupTitle: type.headline,
});
