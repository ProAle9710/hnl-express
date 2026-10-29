import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "@/components/Screen";
import { formatUsd, roundMoney, todayKey } from "@/money";
import { entriesForDay, loadLedger } from "@/storage/ledger";
import { hig, type } from "@/theme";
import type { LedgerEntry } from "@/types";

export function DayScreen() {
  const [rows, setRows] = useState<LedgerEntry[]>([]);
  const [error, setError] = useState("");
  const day = todayKey();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadLedger()
        .then((entries) => {
          if (active) {
            setRows(entriesForDay(entries, day));
            setError("");
          }
        })
        .catch((cause: unknown) => {
          if (!active) return;
          setError(cause instanceof Error ? cause.message : "No se pudo leer el historial.");
        });
      return () => {
        active = false;
      };
    }, [day]),
  );

  const total = roundMoney(rows.reduce((sum, row) => sum + row.profitUsd, 0));

  return (
    <Screen title="Jornada" subtitle={day}>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.caption}>Operaciones</Text>
          <Text style={styles.value}>{rows.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.caption}>Ganancia USD</Text>
          <Text style={styles.value}>{formatUsd(total)}</Text>
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView contentContainerStyle={styles.list}>
        {rows.length === 0 && !error ? <Text style={styles.caption}>Sin operaciones hoy.</Text> : null}
        {rows.map((row) => (
          <View key={row.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{row.transactionId || "Sin ID"}</Text>
              <Text style={styles.caption}>
                {row.charged} − {row.cost} {row.currency}
              </Text>
            </View>
            <Text style={styles.rowUsd}>{formatUsd(row.profitUsd)}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    flexDirection: "row",
    gap: 8,
  },
  metric: {
    flex: 1,
    backgroundColor: hig.cell,
    borderRadius: hig.radius,
    minHeight: 76,
    padding: 12,
    justifyContent: "center",
  },
  caption: type.footnote,
  value: {
    ...type.title2,
    marginTop: 2,
  },
  error: {
    ...type.footnote,
    color: hig.red,
    marginTop: 12,
  },
  list: {
    paddingTop: 12,
    paddingBottom: 32,
    gap: 8,
  },
  row: {
    backgroundColor: hig.cell,
    borderRadius: hig.radius,
    minHeight: hig.hit,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: { flex: 1 },
  rowTitle: type.headline,
  rowUsd: type.headline,
});
