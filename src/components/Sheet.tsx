import { useEffect, useState, type ReactNode } from "react";
import { Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import { Modal, Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [webKeyboard, setWebKeyboard] = useState(0);
  const keyboard = wide ? 0 : Math.max(nativeKeyboard, webKeyboard);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const nav = navigator as Navigator & {
      virtualKeyboard?: {
        overlaysContent: boolean;
        boundingRect: DOMRect;
        addEventListener: (type: string, listener: () => void) => void;
        removeEventListener: (type: string, listener: () => void) => void;
      };
    };
    const virtual = nav.virtualKeyboard;
    if (virtual) virtual.overlaysContent = true;
    let full = window.innerHeight;
    const update = () => {
      full = Math.max(full, window.innerHeight);
      const viewport = window.visualViewport;
      const visible = viewport?.height ?? window.innerHeight;
      const offset = viewport?.offsetTop ?? 0;
      const fromViewport = Math.max(0, full - visible - offset);
      const fromVirtual = virtual?.boundingRect.height ?? 0;
      setWebKeyboard(Math.round(Math.max(fromViewport, fromVirtual)));
    };
    update();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    virtual?.addEventListener("geometrychange", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      virtual?.removeEventListener("geometrychange", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, []);

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
  handle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#C5D0DE",
    marginBottom: 12,
  },
  title: {
    ...type.title2,
    color: hig.label,
    marginBottom: 12,
  },
});
