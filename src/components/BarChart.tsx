import { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { formatUsd } from "@/money";
import { hig, type } from "@/theme";

const PALETTE = [hig.yellow, hig.blue, hig.red, hig.navy, "#FFCE00", "#005BA4"] as const;

export type BarDatum = { label: string; value: number };

type Props = {
  title: string;
  data: BarDatum[];
  hidden?: boolean;
  format?: "usd" | "count";
};

export function BarChart({ title, data, hidden = false, format = "usd" }: Props) {
  const live = data.filter((row) => row.value > 0).slice(0, 6);
  const playing = live.length === 0;
  const count = playing ? PALETTE.length : live.length;
  const peak = Math.max(...live.map((row) => row.value), 1);
  const maxH = 112;

  useEffect(() => {
    if (Platform.OS !== "web" || document.getElementById("hnl-bars")) return;
    const style = document.createElement("style");
    style.id = "hnl-bars";
    style.textContent = `
      @keyframes hnl-bar {
        0%, 100% { transform: scaleY(0.22); }
        50% { transform: scaleY(1); }
      }
      .hnl-idle-bar {
        transform-origin: bottom;
        animation: hnl-bar 1.4s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{playing ? `${title} · en vivo` : title}</Text>
      <View style={styles.row}>
        {Array.from({ length: count }, (_, index) => {
          const color = PALETTE[index % PALETTE.length];
          const h = playing ? maxH : Math.max(8, (live[index].value / peak) * maxH);
          const label = playing ? "" : live[index].label;
          return (
            <View key={playing ? `play-${index}` : live[index].label} style={styles.col}>
              <View style={styles.slot}>
                <View
                  ref={(node) => {
                    if (Platform.OS !== "web" || !node) return;
                    const element = node as unknown as HTMLElement;
                    element.classList.toggle("hnl-idle-bar", playing);
                    element.style.animationDelay = `${index * 120}ms`;
                  }}
                  style={[styles.bar, { height: h, backgroundColor: color }]}
                />
              </View>
              {playing ? null : (
                <Text numberOfLines={2} style={styles.tick}>
                  {label}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      {playing ? (
        <Text style={styles.hint}>Esperando movimiento del día</Text>
      ) : (
        <View style={styles.labels}>
          {live.map((row, index) => (
            <View key={row.label} style={styles.caption}>
              <View style={[styles.dot, { backgroundColor: PALETTE[index % PALETTE.length] }]} />
              <Text numberOfLines={1} style={styles.label}>
                {row.label}
                {hidden ? "" : ` · ${format === "usd" ? formatUsd(row.value) : String(row.value)}`}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: hig.cell,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
  },
  title: { ...type.headline, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "flex-end", minHeight: 140, gap: 8 },
  col: { flex: 1, alignItems: "center" },
  slot: {
    height: 120,
    width: 22,
    borderRadius: 11,
    backgroundColor: hig.fill,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: {
    width: 22,
    borderRadius: 11,
  },
  tick: { ...type.caption, textAlign: "center", marginTop: 6, height: 28, color: hig.navy },
  hint: { ...type.footnote, marginTop: 8 },
  labels: { gap: 4, marginTop: 8 },
  caption: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { ...type.footnote, flex: 1, color: hig.navy },
});
