import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WaveBackdrop } from "@/components/WaveBackdrop";
import { hig, type } from "@/theme";

type Props = {
  title?: string;
  subtitle?: string;
  includeTopInset?: boolean;
  children: ReactNode;
};

export function Screen({ title, subtitle, includeTopInset = true, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <WaveBackdrop />
    <View style={[styles.frame, { paddingTop: includeTopInset ? insets.top + 8 : 8 }]}>
      {title ? (
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: 960,
  },
  title: {
    ...type.largeTitle,
    paddingHorizontal: hig.margin,
  },
  subtitle: {
    ...type.footnote,
    paddingHorizontal: hig.margin,
    marginTop: 4,
  },
  body: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 12,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
  },
});
