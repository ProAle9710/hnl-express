import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Sheet } from "@/components/Sheet";
import { listClients, type ClientRecord } from "@/data/records";
import { hig, type } from "@/theme";

type Props = {
  clientId: string | null;
  onChange: (id: string) => void;
};

export function ClientSelect({ clientId, onChange }: Props) {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "No se pudieron leer los clientes.");
      });
  }, []);

  const current = clients.find((client) => client.id === clientId);

  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={styles.wrap}>
        <View style={styles.field}>
          <View style={styles.face}>
            <Text style={styles.value}>{current?.name ?? "Elegir"}</Text>
          </View>
        </View>
        <Text style={styles.label}>Cliente</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Sheet visible={open} onDismiss={() => setOpen(false)} title="Cliente">
        {clients.length === 0 ? <Text style={styles.hint}>Crea un cliente primero.</Text> : null}
        {clients.map((client) => (
          <Pressable
            key={client.id}
            onPress={() => {
              onChange(client.id);
              setOpen(false);
            }}
            style={styles.option}
          >
            <Text style={[styles.optionText, client.id === clientId ? styles.selected : null]}>{client.name}</Text>
          </Pressable>
        ))}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 8,
    position: "relative",
  },
  field: {
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
    backgroundColor: "rgba(27,39,68,0.18)",
  },
  face: {
    flex: 1,
    margin: 1.5,
    borderRadius: 12.5,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  value: {
    ...type.body,
    color: hig.navy,
    paddingHorizontal: 14,
  },
  label: {
    ...type.caption,
    position: "absolute",
    top: 5,
    left: 12,
    paddingHorizontal: 4,
    backgroundColor: "#FFFFFF",
    color: hig.navy,
    zIndex: 2,
  },
  error: { ...type.footnote, color: hig.red, marginBottom: 8 },
  hint: type.footnote,
  option: { minHeight: hig.hit, justifyContent: "center" },
  optionText: type.body,
  selected: { color: hig.blue, fontWeight: "600" },
});
