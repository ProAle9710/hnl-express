import { type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { RELEASE_MARKDOWN } from "@/data/releaseNotes";
import { hig, type } from "@/theme";

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={index} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Text key={index} style={styles.code}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <Text key={index}>{part}</Text>;
  });
}

function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n/);
  return (
    <View style={styles.release}>
      {blocks.map((line, index) => {
        if (!line.trim()) return <View key={index} style={styles.gap} />;
        if (line.startsWith("## ")) {
          return (
            <Text key={index} style={styles.h2}>
              {inline(line.slice(3))}
            </Text>
          );
        }
        if (line.startsWith("### ")) {
          const heading = line.slice(4);
          const tone =
            heading === "Added" ? styles.added : heading === "Fixed" ? styles.fixed : styles.changed;
          return (
            <Text key={index} style={[styles.h3, tone]}>
              {heading}
            </Text>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <View key={index} style={styles.li}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.item}>{inline(line.slice(2))}</Text>
            </View>
          );
        }
        return (
          <Text key={index} style={styles.p}>
            {inline(line)}
          </Text>
        );
      })}
    </View>
  );
}

export function ReleaseNotes() {
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Markdown source={RELEASE_MARKDOWN} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: 12 },
  release: { gap: 4 },
  gap: { height: 6 },
  h2: { ...type.title2, color: hig.navy, marginBottom: 4 },
  h3: { ...type.headline, marginTop: 12, marginBottom: 4 },
  added: { color: hig.navy },
  changed: { color: hig.blue },
  fixed: { color: hig.red },
  p: { ...type.footnote, color: hig.secondary, marginBottom: 4 },
  li: { flexDirection: "row", gap: 8, paddingVertical: 3 },
  bullet: { ...type.footnote, color: hig.navy, width: 12 },
  item: { ...type.footnote, color: hig.label, flex: 1 },
  bold: { fontWeight: "700", color: hig.navy },
  code: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    backgroundColor: hig.fill,
    color: hig.navy,
    fontSize: 12,
  },
});
