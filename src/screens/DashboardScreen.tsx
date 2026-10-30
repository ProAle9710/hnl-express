import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { useSession } from "@/auth/session";
import { BarChart } from "@/components/BarChart";
import { Loader } from "@/components/Loader";
import { Screen } from "@/components/Screen";
import { Sheet } from "@/components/Sheet";
import { STATUS_TAGS, VOLUME_BANDS } from "@/data/catalog";
import { listClients, listTransactions, type ClientRecord, type TxRecord } from "@/data/records";
import { formatUsd, localDayKey, monthKey, roundMoney, todayKey, weekKey } from "@/money";
import { hig, type } from "@/theme";

type Bar = { id: string; label: string; value: number };
type Range = "day" | "week" | "month" | "all";

const BLUR_KEY = "hnl.privacy.blur";

function tally(slots: { id: string; label: string }[], hits: string[]): Bar[] {
  const counts = new Map(slots.map((slot) => [slot.id, 0]));
  for (const hit of hits) counts.set(hit, (counts.get(hit) ?? 0) + 1);
  return slots.map((slot) => ({ ...slot, value: counts.get(slot.id) ?? 0 }));
}

export function DashboardScreen() {
  const { clientId } = useSession();
  const [allRows, setAllRows] = useState<TxRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("day");
  const [scope, setScope] = useState<"all" | "client">("all");
  const [blur, setBlur] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [raffleOpen, setRaffleOpen] = useState(false);
  const now = new Date().toISOString();
  const day = todayKey();
  const week = weekKey(now);
  const month = monthKey(now);

  const inRange = useCallback(
    (iso: string) => {
      if (range === "day") return localDayKey(iso) === day;
      if (range === "week") return weekKey(iso) === week;
      if (range === "month") return monthKey(iso) === month;
      return true;
    },
    [range, day, week, month],
  );

  const load = useCallback(async () => {
    try {
      const [transactions, nextClients] = await Promise.all([listTransactions(), listClients()]);
      setAllRows(transactions);
      setClients(nextClients);
      setError("");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "No se pudo leer el panel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void AsyncStorage.getItem(BLUR_KEY).then((value) => setBlur(value === "1"));
      void load();
      const timer = setInterval(() => void load(), 8000);
      return () => clearInterval(timer);
    }, [load]),
  );

  const rows = useMemo(() => {
    return allRows.filter((row) => {
      if (scope === "client" && clientId && row.clientId !== clientId) return false;
      return inRange(row.createdAt);
    });
  }, [allRows, scope, clientId, inRange]);

  const names = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients]);
  const byClient = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const servedIds = useMemo(() => new Set(rows.map((row) => row.clientId)), [rows]);
  const served = servedIds.size;
  const fresh = clients.filter((client) => inRange(client.createdAt)).length;
  const bars = useMemo(() => {
    const byMethod = new Map<string, number>();
    for (const row of rows) {
      const method = row.payMethod || "Sin método";
      byMethod.set(method, roundMoney((byMethod.get(method) ?? 0) + (row.profitUsd ?? 0)));
    }
    return [...byMethod.entries()].map(([id, value]) => ({ id, label: id, value }));
  }, [rows]);
  const hours = useMemo(() => {
    const slots = Array.from({ length: 13 }, (_, index) => {
      const hour = index + 8;
      return { id: String(hour), label: `${hour}` };
    });
    return tally(
      slots,
      rows.map((row) => String(new Date(row.createdAt).getHours())),
    );
  }, [rows]);
  const kinds = useMemo(
    () =>
      tally(
        [
          { id: "profit", label: "Ganancia" },
          { id: "receipt", label: "Comprobante" },
        ],
        rows.map((row) => row.kind),
      ),
    [rows],
  );
  const tags = useMemo(
    () =>
      tally(
        [{ id: "", label: "Sin" }, ...STATUS_TAGS.map((tag) => ({ id: tag, label: tag.split(" ")[0] ?? tag }))],
        rows.map((row) => row.tag),
      ),
    [rows],
  );
  const bands = useMemo(
    () =>
      tally(
        VOLUME_BANDS.map((band) => ({ id: band.id, label: band.label.split(" ")[0] ?? band.label })),
        rows.map((row) => row.volumeBand),
      ),
    [rows],
  );
  const people = useMemo(() => {
    const seen = [...servedIds].map((id) => byClient.get(id)).filter((client): client is ClientRecord => client != null);
    return [
      { id: "vip", label: "VIP", value: seen.filter((client) => client.vip).length },
      { id: "deuda", label: "Deuda", value: seen.filter((client) => client.tag === "Deuda").length },
      { id: "pendiente", label: "Pendiente", value: seen.filter((client) => client.tag === "Pago pendiente").length },
      { id: "seguimiento", label: "Seguimiento", value: seen.filter((client) => client.tag === "Seguimiento").length },
    ];
  }, [servedIds, byClient]);
  const total = roundMoney(rows.reduce((sum, row) => sum + (row.profitUsd ?? 0), 0));

  const groups = useMemo(() => {
    const next = new Map<string, TxRecord[]>();
    for (const row of rows) {
      const bucket = next.get(row.clientId) ?? [];
      bucket.push(row);
      next.set(row.clientId, bucket);
    }
    return next;
  }, [rows]);

  const monthProfit = allRows.filter((row) => monthKey(row.createdAt) === month && row.kind === "profit");
  const profitByClient = new Map<string, number>();
  const profitByDay = new Map<string, number>();
  for (const row of monthProfit) {
    profitByClient.set(row.clientId, roundMoney((profitByClient.get(row.clientId) ?? 0) + (row.profitUsd ?? 0)));
    const key = localDayKey(row.createdAt);
    profitByDay.set(key, roundMoney((profitByDay.get(key) ?? 0) + (row.profitUsd ?? 0)));
  }
  const topClient = [...profitByClient.entries()].sort((a, b) => b[1] - a[1])[0];
  const topDay = [...profitByDay.entries()].sort((a, b) => b[1] - a[1])[0];
  const coupons = monthProfit.map((row) => row.clientId);
  const money = (value: string) => (blur ? "••••" : value);
  const rangeLabel = range === "day" ? "Hoy" : range === "week" ? "Semana" : range === "month" ? "Mes" : "Todo";

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

  return (
    <Screen
      title="Panel"
      subtitle={scope === "client" && clientId ? `${rangeLabel} · cliente` : rangeLabel}
    >
      {loading ? (
        <Loader />
      ) : (
        <ScrollView style={styles.fill} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <View style={styles.pills}>
            {(["day", "week", "month", "all"] as const).map((item) => (
              <Pressable
                key={item}
                onPress={() => setRange(item)}
                style={[styles.pill, range === item ? styles.pillOn : null]}
              >
                <Text style={[styles.pillText, range === item ? styles.pillTextOn : null]}>
                  {item === "day" ? "Día" : item === "week" ? "Semana" : item === "month" ? "Mes" : "Todo"}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setScope(scope === "all" ? "client" : "all")}
              style={[styles.pill, scope === "client" ? styles.pillOn : null]}
            >
              <Text style={[styles.pillText, scope === "client" ? styles.pillTextOn : null]}>Cliente</Text>
            </Pressable>
          </View>
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.caption}>Atendidos</Text>
              <Text style={styles.value}>{served}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.caption}>Nuevos</Text>
              <Text style={styles.value}>{fresh}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.caption}>Ganancia</Text>
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
          <BarChart title="Flujo por método" data={bars} hidden={blur} />
          <BarChart title="Por hora" data={hours} format="count" />
          <BarChart title="Tipo" data={kinds} format="count" />
          <BarChart title="Etiqueta" data={tags} format="count" />
          <BarChart title="Volumen" data={bands} format="count" />
          <BarChart title="Clientes" data={people} format="count" />
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
          <Sheet visible={raffleOpen} onDismiss={() => setRaffleOpen(false)} title="Cupón ganador">
            <Text style={styles.headline}>{winner}</Text>
            <Text style={styles.caption}>Un cupón por envío del mes. Recarga gratuita.</Text>
          </Sheet>
        </ScrollView>
      )}
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
  group: { backgroundColor: hig.cell, borderRadius: 14, padding: 12, gap: 4, marginTop: 8 },
  groupTitle: type.headline,
  page: { paddingBottom: 24 },
  fill: { flex: 1 },
});
