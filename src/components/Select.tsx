import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Sheet } from "@/components/Sheet";
import { WritingFrame } from "@/components/WritingFrame";
import { hig, type } from "@/theme";

type Option = { id: string; label: string };

type Props = {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (id: string) => void;
};

export function Select({ label, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.id === value)?.label ?? "Elegir";
  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={styles.wrap}>
        <WritingFrame active={open}>
          <Text style={styles.value}>{current}</Text>
        </WritingFrame>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      <Sheet visible={open} onDismiss={() => setOpen(false)} title={label}>
        {options.map((option) => (
          <Pressable
            key={option.id || "none"}
            onPress={() => {
              onChange(option.id);
              setOpen(false);
            }}
            style={styles.option}
          >
            <Text style={[styles.optionText, option.id === value ? styles.selected : null]}>{option.label}</Text>
          </Pressable>
        ))}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 8,
    position: "relative",
  },
  value: {
    ...type.body,
    color: hig.navy,
    paddingHorizontal: 14,
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
  option: { minHeight: hig.hit, justifyContent: "center" },
  optionText: type.body,
  selected: { color: hig.blue, fontWeight: "600" },
});
