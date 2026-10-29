import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";

import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Screen } from "@/components/Screen";
import { parseAmount } from "@/money";
import type { ReceiptStackParamList, TabParamList } from "@/navigation/types";
import { exportReceipt } from "@/receipt/exportReceipt";
import { receiptHtml } from "@/receipt/template";
import { hig, type } from "@/theme";
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
      destinationAccount: draft.destinationAccount.trim() ? "" : "Indica la cuenta destino.",
      amount: parseAmount(draft.amount) == null ? "Monto con hasta 2 decimales." : "",
      currency: /^[A-Z]{3}$/.test(draft.currency.trim().toUpperCase()) ? "" : "Código de 3 letras.",
      transactionId: draft.transactionId.trim() ? "" : "Indica el ID.",
    };
  }, [draft]);

  const valid = Object.values(errors).every((item) => item === "");

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
    <Screen includeTopInset={false} subtitle={status}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Field
            label="Cuenta destino"
            value={draft.destinationAccount}
            onChangeText={(destinationAccount) => patch({ destinationAccount })}
            error={draft.destinationAccount ? errors.destinationAccount : ""}
          />
          <View style={styles.line} />
          <Field
            label="Monto"
            value={draft.amount}
            keyboardType="decimal-pad"
            onChangeText={(amount) => patch({ amount })}
            error={draft.amount ? errors.amount : ""}
          />
          <View style={styles.line} />
          <Field
            label="Moneda"
            value={draft.currency}
            autoCapitalize="characters"
            onChangeText={(currency) => patch({ currency: currency.toUpperCase() })}
            error={draft.currency ? errors.currency : ""}
          />
          <View style={styles.line} />
          <Field
            label="ID de transacción"
            value={draft.transactionId}
            onChangeText={(transactionId) => patch({ transactionId })}
            error={draft.transactionId ? errors.transactionId : ""}
          />
        </View>
        {!valid ? <Text style={styles.note}>Completa los cuatro campos para emitir.</Text> : null}
        <Button label="Generar y compartir" disabled={!valid || busy} onPress={() => void publish()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 12,
    paddingBottom: 32,
  },
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
  note: {
    ...type.footnote,
  },
});
