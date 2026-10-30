import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BrandSpinner } from "@/components/Loader";
import { WritingFrame } from "@/components/WritingFrame";
import { Sheet } from "@/components/Sheet";
import { listClients, type ClientRecord } from "@/data/records";
import { keepSearch } from "@/data/validate";
import { hig, type } from "@/theme";

type Props = {
  clientId: string | null;
  onChange: (id: string) => void;
};

export function ClientSelect({ clientId, onChange }: Props) {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "No se pudieron leer los clientes.");
      })
      .finally(() => setLoading(false));
  }, []);

  const current = clients.find((client) => client.id === clientId);
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(term) || client.phone.toLowerCase().includes(term),
    );
  }, [clients, query]);

  return (
    <>
      <Pressable accessibilityRole="button" disabled={loading} onPress={() => setOpen(true)} style={styles.wrap}>
        <WritingFrame active={open}>
          {loading ? (
            <View style={styles.spin}>
              <BrandSpinner size={22} />
            </View>
          ) : (
            <Text style={styles.value}>{current?.name ?? "Elegir"}</Text>
          )}
        </WritingFrame>
        <Text style={styles.label}>Cliente</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Sheet
        visible={open}
        onDismiss={() => {
          setOpen(false);
          setQuery("");
        }}
        title="Cliente"
        maxHeight="50%"
        query={query}
        onQueryChange={(value) => setQuery(keepSearch(value))}
      >
        {clients.length === 0 ? <Text style={styles.hint}>Crea un cliente primero.</Text> : null}
        {clients.length > 0 && visible.length === 0 ? <Text style={styles.hint}>Sin coincidencias.</Text> : null}
        {visible.map((client) => (
          <Pressable
            key={client.id}
            onPress={() => {
              onChange(client.id);
              setOpen(false);
              setQuery("");
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
  value: {
    ...type.body,
    color: hig.navy,
    paddingHorizontal: 14,
  },
  spin: { flex: 1, alignItems: "center", justifyContent: "center" },
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
