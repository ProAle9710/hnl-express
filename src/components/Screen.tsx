import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { signOut } from "firebase/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { auth } from "@/firebase/client";
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
      <View style={styles.header}>
        <View style={styles.banner}>
          {title ? (
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={() => void signOut(auth)}
          style={styles.logout}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: 960,
    zIndex: 1,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  banner: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  title: {
    ...type.title2,
  },
  subtitle: {
    ...type.footnote,
    color: hig.navy,
    marginTop: 2,
  },
  logout: {
    minHeight: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  logoutText: {
    ...type.footnote,
    color: hig.red,
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 18,
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
    overflow: "hidden",
  },
});
