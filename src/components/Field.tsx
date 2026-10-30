import { useState, type Ref } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

import { GlyphStrip } from "@/components/GlyphStrip";
import { WritingFrame } from "@/components/WritingFrame";
import { hig, type } from "@/theme";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  keyboardType?: "default" | "decimal-pad" | "phone-pad" | "email-address";
  autoCapitalize?: "none" | "characters" | "words";
  placeholder?: string;
  secureTextEntry?: boolean;
  inputRef?: Ref<TextInput>;
  returnKeyType?: "next" | "go" | "done";
  blurOnSubmit?: boolean;
  onSubmitEditing?: () => void;
  filter?: (value: string) => string;
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
  filter,
}: Props) {
  const [writing, setWriting] = useState(false);
  return (
    <View style={styles.wrap}>
      <WritingFrame active={writing} error={Boolean(error)}>
        <GlyphStrip value={secureTextEntry ? "•".repeat(value.length) : value} />
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
          onChangeText={(next) => {
            setWriting(true);
            onChangeText(filter ? filter(next) : next);
          }}
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
          style={[styles.input, Platform.OS === "web" ? styles.ghost : null]}
          accessibilityLabel={label}
        />
      </WritingFrame>
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
  ghost: {
    color: "transparent",
  },
  error: {
    ...type.caption,
    color: hig.red,
    marginTop: 4,
  },
});
