import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { useSession } from "@/auth/session";
import { Screen } from "@/components/Screen";
import { Sheet } from "@/components/Sheet";
import { listClients, listTransactions, type ClientRecord, type TxRecord } from "@/data/records";
import { formatUsd, localDayKey, monthKey, roundMoney, todayKey, weekKey } from "@/money";
import { hig, type } from "@/theme";

const BLUR_KEY = "hnl.privacy.blur";
type Range = "day" | "week" | "month" | "all";

export function DayScreen() {
  const { clientId } = useSession();
  const [rows, setRows] = useState<TxRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [error, setError] = useState("");
  const [range, setRange] = useState<Range>("day");
  const [scope, setScope] = useState<"all" | "client">("all");
  const [blur, setBlur] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [raffleOpen, setRaffleOpen] = useState(false);
  const now = new Date().toISOString();
  const day = todayKey();
  const week = weekKey(now);
  const month = monthKey(now);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void AsyncStorage.getItem(BLUR_KEY).then((value) => {
        if (active) setBlur(value === "1");
      });
      Promise.all([listTransactions(), listClients()])
        .then(([transactions, nextClients]) => {
          if (!active) return;
          setRows(transactions);
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
    }, []),
  );

  const names = new Map(clients.map((client) => [client.id, client.name]));
  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (scope === "client" && clientId && row.clientId !== clientId) return false;
      if (range === "day") return localDayKey(row.createdAt) === day;
      if (range === "week") return weekKey(row.createdAt) === week;
      if (range === "month") return monthKey(row.createdAt) === month;
      return true;
    });
  }, [rows, scope, clientId, range, day, week, month]);

  const total = roundMoney(filtered.reduce((sum, row) => sum + (row.profitUsd ?? 0), 0));
  const groups = new Map<string, TxRecord[]>();
  for (const row of filtered) {
    const bucket = groups.get(row.clientId) ?? [];
    bucket.push(row);
    groups.set(row.clientId, bucket);
  }

  const monthProfit = rows.filter((row) => monthKey(row.createdAt) === month && row.kind === "profit");
  const byClient = new Map<string, number>();
  const byDay = new Map<string, number>();
  for (const row of monthProfit) {
    byClient.set(row.clientId, roundMoney((byClient.get(row.clientId) ?? 0) + (row.profitUsd ?? 0)));
    const key = localDayKey(row.createdAt);
    byDay.set(key, roundMoney((byDay.get(key) ?? 0) + (row.profitUsd ?? 0)));
  }
  const topClient = [...byClient.entries()].sort((a, b) => b[1] - a[1])[0];
  const topDay = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
  const coupons = monthProfit.map((row) => row.clientId);

  async function toggleBlur() {
    const next = !blur;
    setBlur(next);
    await AsyncStorage.setItem(BLUR_KEY, next ? "1" : "0");
  }

  function spin() {
    if (coupons.length === 0) {
      setWinner("Sin envíos este mes.");
      setRaffleOpen(true);
      return;
    }
    const id = coupons[Math.floor(Math.random() * coupons.length)];
    setWinner(names.get(id) ?? "Cliente");
    setRaffleOpen(true);
  }

  const money = (value: string) => (blur ? "••••" : value);

  return (
    <Screen title="Jornada" subtitle={scope === "client" && clientId ? "Cliente seleccionado" : "Historial"}>
      <View style={styles.pills}>
        {(["day", "week", "month", "all"] as const).map((item) => (
          <Pressable key={item} onPress={() => setRange(item)} style={[styles.pill, range === item ? styles.pillOn : null]}>
            <Text style={[styles.pillText, range === item ? styles.pillTextOn : null]}>
              {item === "day" ? "Día" : item === "week" ? "Semana" : item === "month" ? "Mes" : "Todo"}
            </Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setScope(scope === "all" ? "client" : "all")} style={[styles.pill, scope === "client" ? styles.pillOn : null]}>
          <Text style={[styles.pillText, scope === "client" ? styles.pillTextOn : null]}>Cliente</Text>
        </Pressable>
      </View>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.caption}>Operaciones</Text>
          <Text style={styles.value}>{filtered.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.caption}>Ganancia USD</Text>
          <Text style={styles.value}>{money(formatUsd(total))}</Text>
        </View>
      </View>
      <View style={styles.highlight}>
        <Text style={styles.caption}>Más ganancia este mes</Text>
        <Text style={styles.headline}>
          {topClient ? `${names.get(topClient[0]) ?? "Cliente"} · ${money(formatUsd(topClient[1]))}` : "—"}
        </Text>
        <Text style={styles.caption}>Mejor día</Text>
        <Text style={styles.headline}>{topDay ? `${topDay[0]} · ${money(formatUsd(topDay[1]))}` : "—"}</Text>
        <View style={styles.links}>
          <Pressable onPress={() => void toggleBlur()} style={styles.linkHit}>
            <Text style={styles.link}>{blur ? "Mostrar cifras" : "Ocultar cifras"}</Text>
          </Pressable>
          <Pressable onPress={spin} style={styles.linkHit}>
            <Text style={styles.link}>Sorteo</Text>
          </Pressable>
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
                {row.profitUsd == null ? "" : money(formatUsd(row.profitUsd))}
                {row.tag ? ` · ${row.tag}` : ""}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
      <Sheet visible={raffleOpen} onDismiss={() => setRaffleOpen(false)} title="Cupón ganador">
        <Text style={styles.headline}>{winner}</Text>
        <Text style={styles.caption}>Un cupón por envío del mes. Recarga gratuita.</Text>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  pill: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: hig.fill,
    justifyContent: "center",
  },
  pillOn: { backgroundColor: hig.navy },
  pillText: { ...type.footnote, color: hig.label },
  pillTextOn: { color: "#FFFFFF", fontWeight: "600" },
  metrics: { flexDirection: "row", gap: 8 },
  metric: {
    flex: 1,
    backgroundColor: hig.cell,
    borderRadius: 14,
    minHeight: 76,
    padding: 12,
    justifyContent: "center",
  },
  highlight: { backgroundColor: hig.cell, borderRadius: 14, padding: 12, marginTop: 8, gap: 4 },
  links: { flexDirection: "row", gap: 16, marginTop: 4 },
  linkHit: { minHeight: 32, justifyContent: "center" },
  link: { ...type.footnote, color: hig.blue, fontWeight: "600" },
  caption: type.footnote,
  headline: type.headline,
  value: { ...type.title2, marginTop: 2 },
  error: { ...type.footnote, color: hig.red, marginTop: 12 },
  list: { paddingTop: 12, paddingBottom: 32, gap: 8 },
  group: { backgroundColor: hig.cell, borderRadius: 14, padding: 12, gap: 4 },
  groupTitle: type.headline,
});
