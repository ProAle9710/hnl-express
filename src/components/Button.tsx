import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { hig, type } from "@/theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "plain";
  loading?: boolean;
};

export function Button({ label, onPress, disabled, tone = "primary", loading = false }: Props) {
  const text = <Text style={tone === "primary" ? styles.primaryText : styles.plainText}>{label}</Text>;
  if (loading) {
    return (
      <View style={styles.loading}>
        <View
          pointerEvents="none"
          ref={(node) => {
            if (Platform.OS !== "web" || !node) return;
            (node as unknown as HTMLElement).classList?.add("hnl-field-spin");
          }}
          style={styles.spin}
        />
        <View style={styles.loadingFace}>{text}</View>
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone === "primary" ? styles.primary : styles.plain,
        pressed && !disabled ? styles.pressed : null,
        disabled ? (tone === "primary" ? styles.disabledPrimary : styles.disabled) : null,
      ]}
    >
      {text}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
    borderWidth: 0,
  },
  primary: {
    backgroundColor: hig.yellow,
  },
  plain: {
    backgroundColor: "transparent",
  },
  primaryText: {
    ...type.headline,
    color: hig.navy,
  },
  plainText: {
    ...type.headline,
    color: hig.blue,
  },
  pressed: {
    opacity: 0.72,
  },
  disabledPrimary: {
    backgroundColor: "#F3E7A1",
  },
  disabled: {
    opacity: 0.4,
  },
  loading: {
    minHeight: 50,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
  },
  spin: {
    ...StyleSheet.absoluteFill,
  },
  loadingFace: {
    flex: 1,
    margin: 1.5,
    borderRadius: 12.5,
    backgroundColor: hig.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
});
