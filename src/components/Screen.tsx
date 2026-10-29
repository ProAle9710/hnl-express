import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    backgroundColor: hig.grouped,
    alignItems: "center",
  },
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: 960,
    backgroundColor: hig.grouped,
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
    paddingHorizontal: hig.margin,
    paddingTop: 16,
  },
});
