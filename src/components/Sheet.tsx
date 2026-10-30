import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useKeyboardState } from "react-native-keyboard-controller";
import { Modal, Portal } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlyphStrip } from "@/components/GlyphStrip";
import { WritingFrame } from "@/components/WritingFrame";
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
  query?: string;
  onQueryChange?: (value: string) => void;
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
  query,
  onQueryChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width >= 720;
  const dockEnd = wide && side === "end";
  const nativeKeyboard = useKeyboardState((state) => state.height);
  const webKeyboard = useWebKeyboard();
  const keyboard = wide ? 0 : Math.max(nativeKeyboard, webKeyboard);
  const cap = Math.round((height * Number(maxHeight.replace("%", ""))) / 100);
  const [searching, setSearching] = useState(false);

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
            maxHeight: keyboard > 0 && !dockEnd ? height : cap,
            height: dockEnd ? cap : undefined,
          },
        ]}
      >
        <View style={styles.bar}>
          <Text style={[styles.title, onQueryChange ? null : styles.titleFill]}>{title}</Text>
          {onQueryChange ? (
            <View style={styles.searchWrap}>
              <WritingFrame active={searching} height={36}>
                <GlyphStrip value={query ?? ""} pad={10} />
                <TextInput
                  value={query}
                  onChangeText={onQueryChange}
                  placeholder="Buscar"
                  placeholderTextColor={hig.tertiary}
                  autoCorrect={false}
                  autoCapitalize="none"
                  onFocus={() => setSearching(true)}
                  onBlur={() => setSearching(false)}
                  style={[styles.search, styles.ghost]}
                  accessibilityLabel="Buscar"
                />
              </WritingFrame>
            </View>
          ) : null}
          {closable && onDismiss ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onDismiss} style={styles.close}>
              <Ionicons name="close" size={22} color={hig.navy} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.scroller}
          contentContainerStyle={styles.body}
        >
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
    maxHeight: 420,
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
    flexShrink: 0,
    marginRight: 8,
  },
  titleFill: {
    flex: 1,
  },
  searchWrap: {
    flex: 1,
    minWidth: 96,
    marginRight: 4,
  },
  search: {
    ...type.body,
    height: 36,
    paddingHorizontal: 10,
    color: hig.navy,
    outlineWidth: 0,
    borderWidth: 0,
  },
  ghost: {
    color: "transparent",
  },
  scroller: {
    flexGrow: 0,
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
