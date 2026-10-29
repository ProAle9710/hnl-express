import type { ReactNode } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Modal, Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { hig, type } from "@/theme";

type Props = {
  visible: boolean;
  onDismiss?: () => void;
  title: string;
  children: ReactNode;
  scrim?: boolean;
};

export function Sheet({ visible, onDismiss, title, children, scrim = true }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 720;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        dismissable={Boolean(onDismiss)}
        style={[styles.overlay, wide ? styles.overlayWide : null, scrim ? null : styles.clear]}
        contentContainerStyle={[
          styles.sheet,
          wide ? styles.sheetWide : null,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        {children}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: "flex-end",
  },
  clear: {
    backgroundColor: "transparent",
  },
  overlayWide: {
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: "#F7F4EE",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    width: "100%",
    maxHeight: "62%",
  },
  sheetWide: {
    maxWidth: 440,
    alignSelf: "center",
    borderRadius: 28,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#C9C2B6",
    marginBottom: 12,
  },
  title: {
    ...type.title2,
    color: hig.label,
    marginBottom: 12,
  },
});
