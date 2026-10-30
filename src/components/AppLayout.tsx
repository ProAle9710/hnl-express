import { useEffect, type ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { WaveBackdrop } from "@/components/WaveBackdrop";

export function AppLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const style = document.getElementById("hnl-layout") ?? document.createElement("style");
    style.id = "hnl-layout";
    style.textContent = `
      html, body, #root {
        background: transparent !important;
      }
    `;
    if (!style.parentElement) document.head.appendChild(style);
  }, []);

  return (
    <View style={styles.shell}>
      <WaveBackdrop />
      <View style={styles.body} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "transparent",
  },
  body: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
});
