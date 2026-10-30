import { type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useKeyboardState } from "react-native-keyboard-controller";
import { Modal, Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useWebKeyboard } from "@/hooks/useWebKeyboard";
import { hig, type } from "@/theme";

type Props = {
  visible: boolean;
  onDismiss?: () => void;
  title: string;
  children: ReactNode;
  scrim?: boolean;
  maxHeight?: `${number}%`;
  side?: "bottom" | "end";
  closable?: boolean;
};

export function Sheet({
  visible,
  onDismiss,
  title,
  children,
  scrim = true,
  maxHeight = "62%",
  side = "bottom",
  closable = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 720;
  const dockEnd = wide && side === "end";
  const nativeKeyboard = useKeyboardState((state) => state.height);
  const webKeyboard = useWebKeyboard();
  const keyboard = wide ? 0 : Math.max(nativeKeyboard, webKeyboard);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        dismissable={Boolean(onDismiss)}
        theme={scrim ? undefined : { colors: { backdrop: "transparent" } }}
        style={[styles.overlay, dockEnd ? styles.overlayEnd : null, scrim ? null : styles.clear]}
        contentContainerStyle={[
          styles.sheet,
          wide && side === "bottom" ? styles.sheetWide : null,
          dockEnd ? styles.sheetEnd : null,
          {
            paddingBottom: Math.max(insets.bottom, 20) + keyboard,
            maxHeight: keyboard > 0 && !dockEnd ? "100%" : maxHeight,
            height: dockEnd ? maxHeight : undefined,
          },
        ]}
      >
        <View style={styles.bar}>
          <Text style={styles.title}>{title}</Text>
          {closable && onDismiss ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onDismiss} style={styles.close}>
              <Ionicons name="close" size={22} color={hig.navy} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
          {children}
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: "flex-end",
    zIndex: 20,
  },
  overlayEnd: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  clear: {
    backgroundColor: "transparent",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    width: "100%",
    maxHeight: "62%",
  },
  sheetWide: {
    maxWidth: 560,
    alignSelf: "center",
  },
  sheetEnd: {
    width: 420,
    maxWidth: "42%",
    alignSelf: "flex-end",
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 28,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    ...type.title2,
    color: hig.label,
    flex: 1,
  },
  close: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    gap: 4,
    paddingBottom: 8,
  },
});
