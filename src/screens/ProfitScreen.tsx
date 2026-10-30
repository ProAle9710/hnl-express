import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import { useSession } from "@/auth/session";
import { Button } from "@/components/Button";
import { ClientSelect } from "@/components/ClientSelect";
import { Field } from "@/components/Field";
import { Screen } from "@/components/Screen";
import { Select } from "@/components/Select";
import { PAY_METHODS, STATUS_TAGS, VOLUME_BANDS } from "@/data/catalog";
import { createTransaction } from "@/data/records";
import { formatUsd, parseAmount, roundMoney } from "@/money";
import type { TabParamList } from "@/navigation/types";
import { hig, type } from "@/theme";

type Props = BottomTabScreenProps<TabParamList, "Ganancias">;

const tagOptions = [{ id: "", label: "Sin etiqueta" }, ...STATUS_TAGS.map((tag) => ({ id: tag, label: tag }))];

export function ProfitScreen({ route, navigation }: Props) {
  const { clientId, setClientId } = useSession();
  const prefill = route.params;
  const [charged, setCharged] = useState(prefill?.charged ?? "");
  const [cost, setCost] = useState("");
  const [payMethod, setPayMethod] = useState(prefill?.currency === "COP" ? "COP" : "USD");
  const [usdRate, setUsdRate] = useState(prefill?.currency && prefill.currency !== "USD" ? "" : "1");
  const [unitCost, setUnitCost] = useState("");
  const [cupPerUsd, setCupPerUsd] = useState("");
  const [qty, setQty] = useState("");
  const [volumeBand, setVolumeBand] = useState("");
  const [tag, setTag] = useState("");
  const [transactionId, setTransactionId] = useState(prefill?.transactionId ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);

  useEffect(() => {
    if (!prefill) return;
    if (prefill.charged) setCharged(prefill.charged);
    if (prefill.currency === "COP") setPayMethod("COP");
    if (prefill.currency && prefill.currency !== "USD") setUsdRate("");
    if (prefill.transactionId) setTransactionId(prefill.transactionId);
  }, [prefill]);

  const method = PAY_METHODS.find((item) => item.id === payMethod) ?? PAY_METHODS[0];
  const rateLocked = method.currency === "USD";
  const usdt = method.id === "USDT" || method.id === "CUP";
  const chargedValue = parseAmount(charged);
  const costValue = parseAmount(cost);
  const rateValue = rateLocked ? 1 : parseAmount(usdRate);
  const unitCostValue = unitCost ? parseAmount(unitCost) : null;
  const cupValue = cupPerUsd ? parseAmount(cupPerUsd) : null;
  const qtyValue = qty ? parseAmount(qty) : chargedValue;

  const errors = {
    charged: charged && chargedValue == null ? "Monto cobrado inválido." : "",
    cost: cost && costValue == null ? "Costo inválido." : "",
    usdRate: !rateLocked && usdRate && rateValue == null ? "Tasa a USD inválida." : "",
    unitCost: unitCost && unitCostValue == null ? "Costo unitario inválido." : "",
    cup: cupPerUsd && cupValue == null ? "Tasa CUP inválida." : "",
    qty: qty && qtyValue == null ? "Cantidad inválida." : "",
  };

  const profit = useMemo(() => {
    if (chargedValue == null || rateValue == null) return null;
    const chargedUsd = roundMoney(chargedValue * rateValue);
    if (unitCostValue != null && cupValue != null && cupValue > 0 && qtyValue != null) {
      const costUsd = roundMoney((unitCostValue * qtyValue) / cupValue);
      return roundMoney(chargedUsd - costUsd);
    }
    if (costValue == null) return null;
    return roundMoney((chargedValue - costValue) * rateValue);
  }, [chargedValue, costValue, rateValue, unitCostValue, cupValue, qtyValue]);

  const derivedCost =
    unitCostValue != null && cupValue != null && cupValue > 0 && qtyValue != null && rateValue != null
      ? roundMoney((unitCostValue * qtyValue) / cupValue / rateValue)
      : costValue;

  const ready =
    clientId != null &&
    chargedValue != null &&
    derivedCost != null &&
    rateValue != null &&
    rateValue > 0 &&
    profit != null;

  async function persist() {
    if (!ready || !clientId || chargedValue == null || derivedCost == null || rateValue == null || profit == null) {
      return;
    }
    setBusy(true);
    try {
      await createTransaction({
        clientId,
        kind: "profit",
        destinationAccount: "",
        amount: String(chargedValue),
        currency: method.currency,
        transactionId: transactionId.trim(),
        charged: chargedValue,
        cost: derivedCost,
        usdRate: rateValue,
        profitUsd: profit,
        payMethod: method.id,
        unitCost: unitCostValue,
        unitCostCurrency: unitCostValue == null ? "" : "CUP",
        volumeBand,
        tag,
      });
      setMessage("Operación guardada.");
      setCost("");
      setUnitCost("");
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
    <Screen title="Ganancias" subtitle="Margen en USD">
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ClientSelect clientId={clientId} onChange={setClientId} />
        <View style={styles.pair}>
          <View style={styles.half}>
            <Select
              label="Pago"
              value={method.id}
              options={PAY_METHODS}
              onChange={(id) => {
                setPayMethod(id);
                const next = PAY_METHODS.find((item) => item.id === id);
                if (next?.currency === "USD") setUsdRate("1");
                if (id === "USDT" || id === "CUP") setMore(true);
              }}
            />
          </View>
          <View style={styles.half}>
            <Select label="Volumen" value={volumeBand} options={VOLUME_BANDS} onChange={setVolumeBand} />
          </View>
        </View>
        <View style={styles.pair}>
          <View style={styles.half}>
            <Field label="Cobrado" value={charged} keyboardType="decimal-pad" onChangeText={setCharged} error={errors.charged} />
          </View>
          <View style={styles.half}>
            <Field label="Costo" value={cost} keyboardType="decimal-pad" onChangeText={setCost} error={errors.cost} />
          </View>
        </View>
        {rateLocked ? null : (
          <Field
            label="USD por 1 unidad"
            value={usdRate}
            keyboardType="decimal-pad"
            onChangeText={setUsdRate}
            error={errors.usdRate}
          />
        )}
        <Field label="ID" value={transactionId} onChangeText={setTransactionId} />
        <Pressable onPress={() => setMore((current) => !current)} style={styles.more}>
          <Text style={styles.moreText}>{more ? "Ocultar extras" : "Tasa USDT, etiqueta…"}</Text>
        </Pressable>
        {more ? (
          <>
            <Select label="Etiqueta" value={tag} options={tagOptions} onChange={setTag} />
            {usdt ? (
              <>
                <Field label="Cantidad USDT" value={qty} keyboardType="decimal-pad" onChangeText={setQty} error={errors.qty} />
                <View style={styles.pair}>
                  <View style={styles.half}>
                    <Field
                      label="CUP / USDT"
                      value={unitCost}
                      keyboardType="decimal-pad"
                      onChangeText={setUnitCost}
                      error={errors.unitCost}
                    />
                  </View>
                  <View style={styles.half}>
                    <Field
                      label="CUP por USD"
                      value={cupPerUsd}
                      keyboardType="decimal-pad"
                      onChangeText={setCupPerUsd}
                      error={errors.cup}
                    />
                  </View>
                </View>
              </>
            ) : null}
          </>
        ) : null}
        <View style={styles.result}>
          <Text style={styles.caption}>Ganancia</Text>
          <Text style={styles.profit}>{profit == null ? "—" : formatUsd(profit)}</Text>
        </View>
        {message ? <Text style={styles.note}>{message}</Text> : null}
        <Button label="Guardar" disabled={!ready || busy} onPress={() => void persist()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 0, paddingBottom: 32 },
  pair: { flexDirection: "row" },
  half: { flex: 1 },
  more: { minHeight: 36, justifyContent: "center", paddingHorizontal: 16 },
  moreText: { ...type.footnote, color: hig.blue, fontWeight: "600" },
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
