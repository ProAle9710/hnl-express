import { useEffect, useState, type Ref } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

import { hig, type } from "@/theme";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  keyboardType?: "default" | "decimal-pad";
  autoCapitalize?: "none" | "characters" | "words";
  placeholder?: string;
  secureTextEntry?: boolean;
  inputRef?: Ref<TextInput>;
  returnKeyType?: "next" | "go" | "done";
  blurOnSubmit?: boolean;
  onSubmitEditing?: () => void;
};

export function Field({
  label,
  value,
  onChangeText,
  error,
  keyboardType = "default",
  autoCapitalize = "none",
  placeholder,
  secureTextEntry,
  inputRef,
  returnKeyType,
  blurOnSubmit,
  onSubmitEditing,
}: Props) {
  const [writing, setWriting] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const style = document.getElementById("hnl-field") ?? document.createElement("style");
    style.id = "hnl-field";
    style.textContent = `
      @keyframes hnl-spin {
        to { transform: rotate(360deg); }
      }
      .hnl-field-spin {
        position: absolute;
        inset: -80%;
        background: conic-gradient(
          #FFCE00 0deg 90deg,
          #005BA4 90deg 180deg,
          #E21625 180deg 270deg,
          #FFFFFF 270deg 360deg
        );
        animation: hnl-spin 14s linear infinite;
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
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        {writing && !error ? (
          <View
            pointerEvents="none"
            ref={(node) => {
              if (Platform.OS !== "web" || !node) return;
              (node as unknown as HTMLElement).classList?.add("hnl-field-spin");
            }}
            style={styles.spin}
          />
        ) : null}
        <View style={styles.face}>
        <TextInput
          ref={(node) => {
            if (typeof inputRef === "function") inputRef(node);
            else if (inputRef) inputRef.current = node;
          }}
          value={value}
          returnKeyType={returnKeyType}
          blurOnSubmit={blurOnSubmit}
          onSubmitEditing={onSubmitEditing}
          enterKeyHint={returnKeyType === "next" ? "next" : returnKeyType === "go" ? "go" : undefined}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor={hig.tertiary}
          cursorColor={hig.label}
          selectionColor={hig.blue}
          underlineColorAndroid="transparent"
          onFocus={() => setWriting(true)}
          onBlur={() => setWriting(false)}
          style={styles.input}
          accessibilityLabel={label}
        />
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 8,
    position: "relative",
  },
  field: {
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
    backgroundColor: "rgba(27,39,68,0.18)",
  },
  fieldError: {
    backgroundColor: hig.red,
  },
  spin: {
    ...StyleSheet.absoluteFill,
    backgroundColor: hig.yellow,
  },
  face: {
    flex: 1,
    margin: 1.5,
    borderRadius: 12.5,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    overflow: "visible",
  },
  label: {
    ...type.caption,
    position: "absolute",
    top: 5,
    left: 12,
    paddingHorizontal: 4,
    backgroundColor: "#FFFFFF",
    color: hig.navy,
    zIndex: 2,
  },
  input: {
    ...type.body,
    color: hig.navy,
    height: 48,
    paddingHorizontal: 14,
    paddingVertical: 0,
    margin: 0,
    outlineWidth: 0,
    borderWidth: 0,
  },
  error: {
    ...type.caption,
    color: hig.red,
    marginTop: 4,
  },
});
