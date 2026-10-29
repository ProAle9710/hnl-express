import { Platform, type TextStyle, type ViewStyle } from "react-native";

export const hig = {
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  grouped: "#F2F2F7",
  cell: "#FFFFFF",
  label: "#000000",
  secondary: "rgba(60, 60, 67, 0.6)",
  tertiary: "rgba(60, 60, 67, 0.3)",
  separator: "rgba(60, 60, 67, 0.29)",
  fill: "rgba(120, 120, 128, 0.16)",
  hit: 44,
  margin: 16,
  radius: 10,
  font: Platform.select({
    ios: "System",
    android: "sans-serif",
    default:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif',
  }),
} as const;

export const type = {
  largeTitle: {
    fontFamily: hig.font,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "700",
    letterSpacing: 0.37,
    color: hig.label,
  } satisfies TextStyle,
  title2: {
    fontFamily: hig.font,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: hig.label,
  } satisfies TextStyle,
  headline: {
    fontFamily: hig.font,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    color: hig.label,
  } satisfies TextStyle,
  body: {
    fontFamily: hig.font,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "400",
    color: hig.label,
  } satisfies TextStyle,
  footnote: {
    fontFamily: hig.font,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
    color: hig.secondary,
  } satisfies TextStyle,
  caption: {
    fontFamily: hig.font,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    color: hig.secondary,
  } satisfies TextStyle,
};

export const group: ViewStyle = {
  backgroundColor: hig.cell,
  borderRadius: hig.radius,
  overflow: "hidden",
};
