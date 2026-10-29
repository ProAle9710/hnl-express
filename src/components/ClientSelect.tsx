import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { listClients, type ClientRecord } from "@/data/records";
import { hig, type } from "@/theme";

type Props = {
  clientId: string | null;
  onChange: (id: string) => void;
};

export function ClientSelect({ clientId, onChange }: Props) {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "No se pudieron leer los clientes.");
      });
  }, []);

  return (
    <View style={styles.box}>
      <Text style={styles.label}>Cliente</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {clients.length === 0 && !error ? <Text style={styles.hint}>Crea un cliente primero.</Text> : null}
      {clients.map((client) => {
        const selected = client.id === clientId;
        return (
          <Pressable key={client.id} onPress={() => onChange(client.id)} style={styles.row}>
            <Text style={[styles.name, selected ? styles.selected : null]}>{client.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: hig.cell,
    borderRadius: hig.radius,
    overflow: "hidden",
  },
  label: { ...type.caption, paddingHorizontal: 16, paddingTop: 10 },
  hint: { ...type.footnote, padding: 16 },
  error: { ...type.footnote, color: hig.red, padding: 16 },
  row: { minHeight: hig.hit, justifyContent: "center", paddingHorizontal: 16 },
  name: type.body,
  selected: { color: hig.blue, fontWeight: "600" },
});
