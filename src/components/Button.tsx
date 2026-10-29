import { Pressable, StyleSheet, Text } from "react-native";

import { hig, type } from "@/theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "plain";
};

export function Button({ label, onPress, disabled, tone = "primary" }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone === "primary" ? styles.primary : styles.plain,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={tone === "primary" ? styles.primaryText : styles.plainText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: hig.blue,
  },
  plain: {
    backgroundColor: "transparent",
  },
  primaryText: {
    ...type.headline,
    color: "#FFFFFF",
  },
  plainText: {
    ...type.headline,
    color: hig.blue,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.4,
  },
});
