import { createElement, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { hig, type } from "@/theme";

function ensureCss() {
  if (Platform.OS !== "web") return;
  const style = document.getElementById("hnl-glyph") ?? document.createElement("style");
  style.id = "hnl-glyph";
  style.textContent = `
    @keyframes hnl-ch-in {
      from { opacity: 0; transform: translateY(8px) scale(0.72); }
      to { opacity: 1; transform: none; }
    }
    @keyframes hnl-ch-out {
      from { opacity: 1; transform: none; }
      to { opacity: 0; transform: translateY(-8px) scale(0.5); }
    }
    .hnl-ch {
      display: inline-block;
      font: inherit;
      color: ${hig.navy};
      transform-origin: 50% 80%;
      white-space: pre;
    }
    .hnl-ch-static { color: ${hig.navy}; white-space: pre; }
    .hnl-ch-in { animation: hnl-ch-in 180ms cubic-bezier(.2,.85,.2,1) both; }
    .hnl-ch-out { animation: hnl-ch-out 160ms ease-in forwards; }
    input { caret-color: ${hig.navy}; }
  `;
  if (!style.parentElement) document.head.appendChild(style);
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

type Tail = { key: number; type: "in" | "out"; ch: string };

type Props = {
  value: string;
  pad?: number;
};

export function GlyphStrip({ value, pad = 14 }: Props) {
  const prev = useRef(value);
  const seq = useRef(0);
  const [tail, setTail] = useState<Tail | null>(null);

  useEffect(() => {
    ensureCss();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const before = prev.current;
    prev.current = value;
    if (before === value) return;
    const bd = digits(before);
    const nd = digits(value);
    const typed =
      (value.length === before.length + 1 && value.startsWith(before)) ||
      (nd.length === bd.length + 1 && nd.startsWith(bd));
    const erased =
      (before.length === value.length + 1 && before.startsWith(value)) ||
      (bd.length === nd.length + 1 && bd.startsWith(nd));
    if (typed) {
      setTail({ key: ++seq.current, type: "in", ch: value.slice(-1) });
      return;
    }
    if (erased) {
      setTail({ key: ++seq.current, type: "out", ch: before.slice(-1) });
      return;
    }
    setTail(null);
  }, [value]);

  if (Platform.OS !== "web") return null;

  const incoming = tail?.type === "in";
  const body = incoming ? value.slice(0, -1) : value;

  return (
    <View pointerEvents="none" style={[styles.row, { paddingHorizontal: pad }]}>
      {createElement("span", { className: "hnl-ch-static", children: body })}
      {incoming && tail
        ? createElement("span", {
            key: tail.key,
            className: "hnl-ch hnl-ch-in",
            children: tail.ch === " " ? "\u00a0" : tail.ch,
            onAnimationEnd: () => setTail((current) => (current?.key === tail.key ? null : current)),
          })
        : null}
      {tail?.type === "out"
        ? createElement("span", {
            key: tail.key,
            className: "hnl-ch hnl-ch-out",
            children: tail.ch === " " ? "\u00a0" : tail.ch,
            onAnimationEnd: () => setTail((current) => (current?.key === tail.key ? null : current)),
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    zIndex: 2,
    ...type.body,
  },
});
