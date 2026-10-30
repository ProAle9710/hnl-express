import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";

import { useSession } from "@/auth/session";
import { Button } from "@/components/Button";
import { ClientSelect } from "@/components/ClientSelect";
import { Field } from "@/components/Field";
import { Screen } from "@/components/Screen";
import { createTransaction } from "@/data/records";
import { parseAmount } from "@/money";
import {
  accountError,
  amountError,
  currencyError,
  idError,
  keepAccount,
  keepCurrency,
  keepId,
  keepMoney,
} from "@/data/validate";
import type { ReceiptStackParamList, TabParamList } from "@/navigation/types";
import { exportReceipt } from "@/receipt/exportReceipt";
import { receiptHtml } from "@/receipt/template";
import { type } from "@/theme";
import type { ReceiptDraft } from "@/types";
import { extractReceipt, VisionConfigError } from "@/vision/extract";

type Props = NativeStackScreenProps<ReceiptStackParamList, "Revision">;

const empty: ReceiptDraft = {
  destinationAccount: "",
  amount: "",
  currency: "USD",
  transactionId: "",
};

export function ReviewScreen({ route }: Props) {
  const { clientId, setClientId } = useSession();
  const tabNavigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [draft, setDraft] = useState<ReceiptDraft>(empty);
  const [status, setStatus] = useState("Leyendo comprobante…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    extractReceipt(route.params.imageBase64, route.params.mimeType)
      .then((next) => {
        if (!active) return;
        setDraft(next);
        setStatus("Revisa los datos antes de emitir.");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStatus(
          error instanceof VisionConfigError
            ? "Visión sin configurar. Completa los campos a mano."
            : error instanceof Error
              ? error.message
              : "No se pudo extraer el comprobante.",
        );
      });
    return () => {
      active = false;
    };
  }, [route.params.imageBase64, route.params.mimeType]);

  const errors = useMemo(() => {
    return {
      destinationAccount: accountError(draft.destinationAccount),
      amount: amountError(draft.amount),
      currency: currencyError(draft.currency),
      transactionId: idError(draft.transactionId, true),
    };
  }, [draft]);

  const valid = Object.values(errors).every((item) => item === "") && clientId != null;

  function patch(partial: Partial<ReceiptDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  async function publish() {
    if (!valid) return;
    setBusy(true);
    const normalized: ReceiptDraft = {
      ...draft,
      destinationAccount: draft.destinationAccount.trim(),
      amount: String(parseAmount(draft.amount)),
      currency: draft.currency.trim().toUpperCase(),
      transactionId: draft.transactionId.trim(),
    };
    try {
      if (!clientId) return;
      await createTransaction({
        clientId,
        kind: "receipt",
        destinationAccount: normalized.destinationAccount,
        amount: normalized.amount,
        currency: normalized.currency,
        transactionId: normalized.transactionId,
        charged: null,
        cost: null,
        usdRate: null,
        profitUsd: null,
        payMethod: "",
        unitCost: null,
        unitCostCurrency: "",
        volumeBand: "",
        tag: "",
        operaciones: [],
      });
      await exportReceipt(receiptHtml(normalized, new Date()));
      tabNavigation.navigate("Ganancias", {
        charged: normalized.amount,
        currency: normalized.currency,
        transactionId: normalized.transactionId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo generar el comprobante.";
      if (Platform.OS === "web") window.alert(message);
      else Alert.alert("Comprobante", message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Datos" includeTopInset={false} subtitle={status}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ClientSelect clientId={clientId} onChange={setClientId} />
        <Field
          label="Cuenta destino"
          value={draft.destinationAccount}
          onChangeText={(destinationAccount) => patch({ destinationAccount })}
          filter={keepAccount}
          error={draft.destinationAccount ? errors.destinationAccount : ""}
        />
        <View style={styles.pair}>
          <View style={styles.half}>
            <Field
              label="Monto"
              value={draft.amount}
              keyboardType="decimal-pad"
              onChangeText={(amount) => patch({ amount })}
              filter={keepMoney}
              error={draft.amount ? errors.amount : ""}
            />
          </View>
          <View style={styles.half}>
            <Field
              label="Moneda"
              value={draft.currency}
              autoCapitalize="characters"
              onChangeText={(currency) => patch({ currency })}
              filter={keepCurrency}
              error={draft.currency ? errors.currency : ""}
            />
          </View>
        </View>
        <Field
          label="ID"
          value={draft.transactionId}
          onChangeText={(transactionId) => patch({ transactionId })}
          filter={keepId}
          error={draft.transactionId ? errors.transactionId : ""}
        />
        {!valid ? <Text style={styles.note}>Completa los datos para emitir.</Text> : null}
        <Button label="Generar y compartir" disabled={!valid || busy} loading={busy} onPress={() => void publish()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 32,
  },
  pair: { flexDirection: "row" },
  half: { flex: 1 },
  note: {
    ...type.footnote,
    marginVertical: 8,
  },
});
