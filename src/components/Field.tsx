import { StyleSheet, Text, TextInput, View } from "react-native";

import { hig, type } from "@/theme";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  keyboardType?: "default" | "decimal-pad";
  autoCapitalize?: "none" | "characters" | "words";
  placeholder?: string;
};

export function Field({
  label,
  value,
  onChangeText,
  error,
  keyboardType = "default",
  autoCapitalize = "none",
  placeholder,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={hig.tertiary}
        style={[styles.input, error ? styles.inputError : null]}
        accessibilityLabel={label}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: hig.hit,
    justifyContent: "center",
  },
  label: {
    ...type.caption,
    marginBottom: 4,
  },
  input: {
    ...type.body,
    minHeight: hig.hit,
    paddingVertical: 8,
  },
  inputError: {
    color: hig.red,
  },
  error: {
    ...type.caption,
    color: hig.red,
    marginBottom: 4,
  },
});
