import { type ReactNode } from "react";
import { StyleSheet, Text, useWindowDimensions } from "react-native";
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
};

export function Sheet({ visible, onDismiss, title, children, scrim = true, maxHeight = "62%" }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 720;
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
        style={[
          styles.overlay,
          wide ? styles.overlayWide : null,
          scrim ? null : styles.clear,
        ]}
        contentContainerStyle={[
          styles.sheet,
          wide ? styles.sheetWide : null,
          {
            paddingBottom: Math.max(insets.bottom, 20) + keyboard,
            maxHeight: keyboard > 0 ? "100%" : maxHeight,
          },
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        {children}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: "flex-end",
    zIndex: 20,
  },
  clear: {
    backgroundColor: "transparent",
  },
  overlayWide: {
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: "#FFFFFF",
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
  title: {
    ...type.title2,
    color: hig.label,
    marginBottom: 12,
  },
});
