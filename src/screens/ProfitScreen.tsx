import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import { useSession } from "@/auth/session";
import { Button } from "@/components/Button";
import { ClientSelect } from "@/components/ClientSelect";
import { Field } from "@/components/Field";
import { Screen } from "@/components/Screen";
import { Select } from "@/components/Select";
import { PAY_METHODS, RATE_OPTIONS, STATUS_TAGS } from "@/data/catalog";
import { createTransaction, type Operacion } from "@/data/records";
import { formatUsd, parseAmount, roundGain } from "@/money";
import { amountError, idError, keepId, keepMoney, keepRate, rateError } from "@/data/validate";
import type { TabParamList } from "@/navigation/types";
import { hig, type } from "@/theme";

type Props = BottomTabScreenProps<TabParamList, "Ganancias">;

type Line = {
  key: string;
  montoCliente: string;
  valorCop: string;
  pagoCliente: string;
  costoReal: string;
  payMethod: string;
  tasa: string;
  tasaCustom: string;
};

const tagOptions = [{ id: "", label: "Sin etiqueta" }, ...STATUS_TAGS.map((tag) => ({ id: tag, label: tag }))];

function blankLine(): Line {
  return {
    key: `${Date.now()}-${Math.random()}`,
    montoCliente: "",
    valorCop: "",
    pagoCliente: "",
    costoReal: "",
    payMethod: PAY_METHODS[0].id,
    tasa: "",
    tasaCustom: "",
  };
}

function lineGain(line: Line): number | null {
  const montoCliente = parseAmount(line.montoCliente);
  const valorCop = parseAmount(line.valorCop);
  const pagoCliente = parseAmount(line.pagoCliente);
  const costoReal = parseAmount(line.costoReal);
  if (montoCliente == null || valorCop == null || pagoCliente == null || costoReal == null) return null;
  if (valorCop === 0 || costoReal === 0) return null;
  return roundGain(montoCliente / valorCop - pagoCliente / costoReal);
}

function suggestedRate(line: Line): string {
  const montoCliente = parseAmount(line.montoCliente);
  const valorCop = parseAmount(line.valorCop);
  if (montoCliente == null || valorCop == null || valorCop === 0) return "";
  const usd = montoCliente / valorCop;
  if (usd >= 150 || montoCliente >= 1_000_000) return "6%";
  if (usd >= 100) return "8%";
  return "";
}

export function ProfitScreen({ route, navigation }: Props) {
  const { clientId, setClientId } = useSession();
  const prefill = route.params;
  const [lines, setLines] = useState<Line[]>([blankLine()]);
  const [tag, setTag] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!prefill?.charged && !prefill?.transactionId) return;
    setLines((current) => {
      const [first, ...rest] = current;
      if (!first) return current;
      return [{ ...first, montoCliente: prefill.charged ?? first.montoCliente }, ...rest];
    });
    if (prefill.transactionId) setTransactionId(prefill.transactionId);
  }, [prefill]);

  const gains = useMemo(() => lines.map(lineGain), [lines]);
  const complete = gains.every((item) => item != null);
  const profit = complete ? roundGain(gains.reduce((sum, item) => sum + (item ?? 0), 0)) : null;
  const ratesOk = lines.every((line) => line.tasa !== "custom" || !rateError(line.tasaCustom));
  const ready = clientId != null && profit != null && !idError(transactionId) && ratesOk;

  function patch(index: number, partial: Partial<Line>) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...partial } : line)));
  }

  async function persist() {
    if (!ready || !clientId || profit == null) return;
    const operaciones: Operacion[] = lines.map((line) => ({
      montoCliente: parseAmount(line.montoCliente),
      valorCop: parseAmount(line.valorCop),
      pagoCliente: parseAmount(line.pagoCliente),
      costoReal: parseAmount(line.costoReal),
      payMethod: line.payMethod,
      tasa: line.tasa === "custom" ? line.tasaCustom.trim() : line.tasa,
    }));
    const first = operaciones[0];
    setBusy(true);
    try {
      await createTransaction({
        clientId,
        kind: "profit",
        destinationAccount: "",
        amount: String(first?.montoCliente ?? ""),
        currency: "COP",
        transactionId: transactionId.trim(),
        charged: first?.montoCliente ?? null,
        cost: first?.costoReal ?? null,
        usdRate: first?.valorCop ?? null,
        profitUsd: profit,
        payMethod: first?.payMethod ?? "",
        unitCost: first?.costoReal ?? null,
        unitCostCurrency: "COP",
        volumeBand: "",
        tag,
        operaciones,
      });
      setMessage("Operación guardada.");
      setLines([blankLine()]);
      navigation.navigate("Panel");
    } catch (error) {
      const text = error instanceof Error ? error.message : "No se pudo guardar.";
      if (Platform.OS === "web") window.alert(text);
      else Alert.alert("Ganancias", text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Ganancias" subtitle="Margen en USD">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ClientSelect clientId={clientId} onChange={setClientId} />
        {lines.map((line, index) => {
          const gain = gains[index];
          const hint = suggestedRate(line);
          return (
            <View key={line.key} style={styles.block}>
              <Text style={styles.caption}>{lines.length > 1 ? `Operación ${index + 1}` : "Operación"}</Text>
              <Select
                label="Pago"
                value={line.payMethod}
                options={PAY_METHODS}
                onChange={(id) => patch(index, { payMethod: id })}
              />
              <Field
                label="Monto cliente COP"
                value={line.montoCliente}
                keyboardType="decimal-pad"
                placeholder="1,000.00"
                onChangeText={(montoCliente) => patch(index, { montoCliente })}
                filter={keepMoney}
                error={line.montoCliente ? amountError(line.montoCliente) : ""}
              />
              <Field
                label="Valor COP"
                value={line.valorCop}
                keyboardType="decimal-pad"
                placeholder="3,170.00"
                onChangeText={(valorCop) => patch(index, { valorCop })}
                filter={keepMoney}
                error={line.valorCop ? amountError(line.valorCop, "Valor inválido.") : ""}
              />
              <Field
                label="Pago al cliente"
                value={line.pagoCliente}
                keyboardType="decimal-pad"
                onChangeText={(pagoCliente) => patch(index, { pagoCliente })}
                filter={keepMoney}
                error={line.pagoCliente ? amountError(line.pagoCliente, "Pago inválido.") : ""}
              />
              <Field
                label="Costo real"
                value={line.costoReal}
                keyboardType="decimal-pad"
                onChangeText={(costoReal) => patch(index, { costoReal })}
                filter={keepMoney}
                error={line.costoReal ? amountError(line.costoReal, "Costo inválido.") : ""}
              />
              <Select
                label="Tasa"
                value={line.tasa}
                options={RATE_OPTIONS}
                onChange={(tasa) => patch(index, { tasa })}
              />
              {hint ? <Text style={styles.caption}>Sugerida {hint}. No cambia la fórmula.</Text> : null}
              {line.tasa === "custom" ? (
                <Field
                  label="Tasa personalizada"
                  value={line.tasaCustom}
                  onChangeText={(tasaCustom) => patch(index, { tasaCustom })}
                  filter={keepRate}
                  error={line.tasaCustom ? rateError(line.tasaCustom) : ""}
                />
              ) : null}
              <Text style={styles.lineGain}>{gain == null ? "—" : formatUsd(gain)}</Text>
              {lines.length > 1 ? (
                <Pressable onPress={() => setLines((current) => current.filter((_, i) => i !== index))} style={styles.more}>
                  <Text style={styles.moreText}>Quitar operación</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
        <Pressable onPress={() => setLines((current) => [...current, blankLine()])} style={styles.more}>
          <Text style={styles.moreText}>Añadir otra operación</Text>
        </Pressable>
        <Select label="Etiqueta" value={tag} options={tagOptions} onChange={setTag} />
        <Field
          label="ID"
          value={transactionId}
          onChangeText={setTransactionId}
          filter={keepId}
          error={transactionId ? idError(transactionId) : ""}
        />
        <View style={styles.result}>
          <Text style={styles.caption}>Ganancia</Text>
          <Text style={styles.profit}>{profit == null ? "—" : formatUsd(profit)}</Text>
        </View>
        {message ? <Text style={styles.note}>{message}</Text> : null}
        <Button label="Guardar" disabled={!ready || busy} loading={busy} onPress={() => void persist()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 0, paddingBottom: 32 },
  block: { marginBottom: 8 },
  more: { minHeight: 36, justifyContent: "center", paddingHorizontal: 16 },
  moreText: { ...type.footnote, color: hig.blue, fontWeight: "600" },
  lineGain: { ...type.headline, paddingHorizontal: 16, marginBottom: 4 },
  result: {
    backgroundColor: hig.cell,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  caption: type.footnote,
  profit: type.title2,
  note: { ...type.footnote, marginBottom: 8 },
});
