import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Screen } from "@/components/Screen";
import { formatUsd, parseAmount, roundMoney } from "@/money";
import type { TabParamList } from "@/navigation/types";
import { saveEntry } from "@/storage/ledger";
import { hig, type } from "@/theme";

type Props = BottomTabScreenProps<TabParamList, "Ganancias">;

export function ProfitScreen({ route, navigation }: Props) {
  const prefill = route.params;
  const [charged, setCharged] = useState(prefill?.charged ?? "");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState(prefill?.currency ?? "USD");
  const [usdRate, setUsdRate] = useState(prefill?.currency && prefill.currency !== "USD" ? "" : "1");
  const [transactionId, setTransactionId] = useState(prefill?.transactionId ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!prefill) return;
    if (prefill.charged) setCharged(prefill.charged);
    if (prefill.currency) {
      setCurrency(prefill.currency);
      if (prefill.currency === "USD") setUsdRate("1");
    }
    if (prefill.transactionId) setTransactionId(prefill.transactionId);
  }, [prefill]);

  const code = currency.trim().toUpperCase();
  const rateLocked = code === "USD";
  const chargedValue = parseAmount(charged);
  const costValue = parseAmount(cost);
  const rateValue = rateLocked ? 1 : parseAmount(usdRate);

  const errors = {
    charged: charged && chargedValue == null ? "Monto cobrado inválido." : "",
    cost: cost && costValue == null ? "Costo inválido." : "",
    currency: code && !/^[A-Z]{3}$/.test(code) ? "Código de 3 letras." : "",
    usdRate: !rateLocked && usdRate && rateValue == null ? "Tasa a USD inválida." : "",
  };

  const profit = useMemo(() => {
    if (chargedValue == null || costValue == null || rateValue == null) return null;
    return roundMoney((chargedValue - costValue) * rateValue);
  }, [chargedValue, costValue, rateValue]);

  const ready =
    chargedValue != null &&
    costValue != null &&
    /^[A-Z]{3}$/.test(code) &&
    rateValue != null &&
    rateValue > 0;

  async function persist() {
    if (!ready || chargedValue == null || costValue == null || rateValue == null || profit == null) {
      return;
    }
    setBusy(true);
    try {
      await saveEntry({
        id: `${Date.now()}-${transactionId.trim() || "op"}`,
        createdAt: new Date().toISOString(),
        charged: chargedValue,
        cost: costValue,
        currency: code,
        usdRate: rateValue,
        profitUsd: profit,
        transactionId: transactionId.trim(),
      });
      setMessage("Operación guardada en este dispositivo.");
      setCost("");
      navigation.navigate("Jornada");
    } catch (error) {
      const text = error instanceof Error ? error.message : "No se pudo guardar.";
      if (Platform.OS === "web") window.alert(text);
      else Alert.alert("Ganancias", text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Ganancias" subtitle="Cobrado menos costo, expresado en USD.">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Field
            label="Cobrado al cliente"
            value={charged}
            keyboardType="decimal-pad"
            onChangeText={setCharged}
            error={errors.charged}
          />
          <View style={styles.line} />
          <Field
            label="Costo pagado"
            value={cost}
            keyboardType="decimal-pad"
            onChangeText={setCost}
            error={errors.cost}
          />
          <View style={styles.line} />
          <Field
            label="Moneda"
            value={currency}
            autoCapitalize="characters"
            onChangeText={(value) => {
              const next = value.toUpperCase();
              setCurrency(next);
              if (next.trim() === "USD") setUsdRate("1");
            }}
            error={errors.currency}
          />
          <View style={styles.line} />
          <Field
            label="USD por 1 unidad"
            value={rateLocked ? "1" : usdRate}
            keyboardType="decimal-pad"
            onChangeText={(value) => {
              if (!rateLocked) setUsdRate(value);
            }}
            error={errors.usdRate}
          />
          <View style={styles.line} />
          <Field
            label="ID de transacción"
            value={transactionId}
            onChangeText={setTransactionId}
          />
        </View>
        <Text style={styles.profit}>{profit == null ? "Ganancia —" : formatUsd(profit)}</Text>
        {message ? <Text style={styles.note}>{message}</Text> : null}
        <Button label="Guardar operación" disabled={!ready || busy} onPress={() => void persist()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 12, paddingBottom: 32 },
  card: {
    backgroundColor: hig.cell,
    borderRadius: hig.radius,
    overflow: "hidden",
  },
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: hig.separator,
    marginLeft: 16,
  },
  profit: {
    ...type.title2,
    paddingHorizontal: 4,
  },
  note: { ...type.footnote },
});
