import { useEffect, type ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { hig } from "@/theme";

function ensureCss() {
  if (Platform.OS !== "web") return;
  const style = document.getElementById("hnl-field") ?? document.createElement("style");
  style.id = "hnl-field";
  style.textContent = `
    @keyframes hnl-spin {
      to { transform: rotate(360deg); }
    }
    [data-hnl="clip"] {
      overflow: hidden !important;
    }
    [data-hnl="clip"]::before {
      content: "";
      position: absolute;
      inset: -80%;
      z-index: 0;
      pointer-events: none;
      opacity: 0;
      background: conic-gradient(
        #FFCE00 0deg 90deg,
        #005BA4 90deg 180deg,
        #E21625 180deg 270deg,
        #FFFFFF 270deg 360deg
      );
    }
    [data-hnl="clip"]:focus-within::before,
    [data-hnl="clip"][data-on="1"]::before {
      opacity: 1;
      animation: hnl-spin 3s linear infinite;
    }
    [data-hnl="clip"][data-err="1"]::before {
      display: none;
    }
    input, input:focus, [role="button"] {
      outline: none;
      border: 0;
      box-shadow: none;
      -webkit-appearance: none;
      appearance: none;
      -webkit-tap-highlight-color: transparent;
    }
  `;
  if (!style.parentElement) document.head.appendChild(style);
}

type Props = {
  active: boolean;
  error?: boolean;
  height?: number;
  children: ReactNode;
};

export function WritingFrame({ active, error = false, height = 48, children }: Props) {
  useEffect(() => {
    ensureCss();
  }, []);
  return (
    <View
      dataSet={{
        hnl: "clip",
        on: active && !error ? "1" : undefined,
        err: error ? "1" : undefined,
      }}
      style={[styles.field, { height }, error ? styles.fieldError : null]}
    >
      <View style={styles.face}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
    backgroundColor: "rgba(27,39,68,0.18)",
    position: "relative",
  },
  fieldError: {
    backgroundColor: hig.red,
  },
  face: {
    flex: 1,
    margin: 1.5,
    borderRadius: 12.5,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 1,
  },
});
