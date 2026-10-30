import { useEffect, useRef } from "react";
import { Platform, StyleSheet, Text, useWindowDimensions, View, type TextStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

function hillRound(width: number, height: number, base: number, amplitude: number, phase: number): string {
  const steps = 36;
  let path = "";
  for (let index = 0; index <= steps; index += 1) {
    const x = (index / steps) * width * 2 - phase * width;
    const y = base + Math.sin((index / steps) * Math.PI * 4 + phase * Math.PI * 2) * amplitude;
    path += index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  path += ` L ${width} ${height} L ${-phase * width} ${height} Z`;
  return path;
}

const layers = [
  { color: "#FFCE00", opacity: 0.7, desktop: 0.34, mobile: 0.08, amplitude: 70, mobileAmplitude: 16, phase: 0.05, delay: -4200, reverse: false, duration: 36000 },
  { color: "#E21625", opacity: 0.88, desktop: 0.46, mobile: 0.18, amplitude: 86, mobileAmplitude: 22, phase: 0.41, delay: -11000, reverse: true, duration: 30000 },
  { color: "#C99700", opacity: 0.95, desktop: 0.56, mobile: 0.28, amplitude: 64, mobileAmplitude: 14, phase: 0.73, delay: -7000, reverse: false, duration: 26000 },
  { color: "#9E1018", opacity: 0.96, desktop: 0.66, mobile: 0.36, amplitude: 78, mobileAmplitude: 20, phase: 0.22, delay: -16000, reverse: true, duration: 22000 },
  { color: "#005BA4", opacity: 0.9, desktop: 0.78, mobile: 0.46, amplitude: 90, mobileAmplitude: 18, phase: 0.88, delay: -3000, reverse: false, duration: 18000 },
  { color: "#003F78", opacity: 0.96, desktop: 0.88, mobile: 0.54, amplitude: 72, mobileAmplitude: 24, phase: 0.57, delay: -13000, reverse: true, duration: 15000 },
];

export function WaveBackdrop() {
  const { width, height } = useWindowDimensions();
  const tile = Math.max(Math.ceil(width), 320);
  const wide = width >= 720;

  useEffect(() => {
    if (Platform.OS !== "web" || document.getElementById("hnl-waves")) return;
    const style = document.createElement("style");
    style.id = "hnl-waves";
    style.textContent = `
      @keyframes hnl-wave {
        from { transform: translate3d(0, 0, 0); }
        to { transform: translate3d(-50%, 0, 0); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <View style={styles.fill} pointerEvents="none">
      {layers.map((layer) => (
        <View
          key={layer.duration}
          ref={(node) => {
            if (Platform.OS !== "web" || !node) return;
            const element = node as unknown as HTMLElement;
            element.dataset.hnlWave = layer.color;
            element.dataset.hnlBase = String(height * (wide ? layer.desktop : layer.mobile));
            element.dataset.hnlAmp = String(wide ? layer.amplitude : layer.mobileAmplitude);
            element.dataset.hnlPhase = String(layer.phase);
            element.style.animation = `${layer.duration}ms linear infinite hnl-wave`;
            element.style.animationDelay = `${layer.delay}ms`;
            element.style.animationDirection = layer.reverse ? "reverse" : "normal";
          }}
          style={[styles.track, { width: tile * 2, height }]}
        >
          {[0, 1].map((copy) => (
            <Svg key={copy} width={tile} height={height}>
              <Path
                d={hillRound(
                  tile,
                  height,
                  height * (wide ? layer.desktop : layer.mobile),
                  wide ? layer.amplitude : layer.mobileAmplitude,
                  layer.phase,
                )}
                fill={layer.color}
                opacity={layer.opacity}
              />
            </Svg>
          ))}
        </View>
      ))}
    </View>
  );
}

type WaveSample = {
  left: number;
  top: number;
  base: number;
  amp: number;
  phase: number;
  yellow: boolean;
};

function readWaves(): WaveSample[] {
  return [...document.querySelectorAll<HTMLElement>("[data-hnl-wave]")].map((track) => {
    const rect = track.getBoundingClientRect();
    const color = track.dataset.hnlWave;
    return {
      left: rect.left,
      top: rect.top,
      base: Number(track.dataset.hnlBase),
      amp: Number(track.dataset.hnlAmp),
      phase: Number(track.dataset.hnlPhase),
      yellow: color === "#FFCE00" || color === "#C99700",
    };
  });
}

export function WaveWord({
  text,
  style,
  hidden,
  layer = "1",
}: {
  text: string;
  style?: TextStyle;
  hidden?: boolean;
  layer?: string;
}) {
  const ref = useRef<Text>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const source = ref.current as unknown as HTMLElement | null;
    if (!source) return;
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = layer;
    canvas.style.transition = "opacity 180ms ease";
    canvas.style.opacity = hidden ? "0" : "1";
    canvasRef.current = canvas;
    document.body.appendChild(canvas);
    const context = canvas.getContext("2d");
    if (!context) return;
    let mask: Uint8Array | null = null;
    let maskW = 0;
    let maskH = 0;
    let frame = 0;
    const draw = () => {
      const rect = source.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.ceil(rect.width * ratio));
      const height = Math.max(1, Math.ceil(rect.height * ratio));
      canvas.style.left = `${rect.left}px`;
      canvas.style.top = `${rect.top}px`;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      if (width !== maskW || height !== maskH) {
        maskW = width;
        maskH = height;
        canvas.width = width;
        canvas.height = height;
        const computed = getComputedStyle(source);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, rect.width, rect.height);
        context.font = computed.font;
        context.letterSpacing = computed.letterSpacing;
        context.fillStyle = "#fff";
        context.textAlign = computed.textAlign === "center" ? "center" : "left";
        context.textBaseline = "middle";
        context.fillText(text, context.textAlign === "center" ? rect.width / 2 : 0, rect.height / 2);
        context.setTransform(1, 0, 0, 1, 0, 0);
        const stamp = context.getImageData(0, 0, width, height).data;
        mask = new Uint8Array(width * height);
        for (let index = 0; index < mask.length; index += 1) mask[index] = stamp[index * 4 + 3] > 16 ? 1 : 0;
      }
      const tile = Math.max(Math.ceil(window.innerWidth), 320);
      const waves = readWaves();
      const pixels = context.createImageData(width, height);
      for (let index = 0; index < (mask?.length ?? 0); index += 1) {
        if (!mask?.[index]) continue;
        const x = rect.left + (index % width) / ratio;
        const y = rect.top + Math.floor(index / width) / ratio;
        let yellowText = false;
        for (let waveIndex = waves.length - 1; waveIndex >= 0; waveIndex -= 1) {
          const wave = waves[waveIndex];
          const localX = x - wave.left;
          const xInSvg = ((localX % tile) + tile) % tile;
          const crest =
            wave.base +
            Math.sin(((xInSvg + wave.phase * tile) / (tile * 2)) * Math.PI * 4 + wave.phase * Math.PI * 2) * wave.amp;
          if (y - wave.top < crest) continue;
          yellowText = !wave.yellow;
          break;
        }
        const offset = index * 4;
        if (yellowText) {
          pixels.data[offset] = 255;
          pixels.data[offset + 1] = 206;
          pixels.data[offset + 2] = 0;
        } else {
          pixels.data[offset] = 30;
          pixels.data[offset + 1] = 78;
          pixels.data[offset + 2] = 158;
        }
        pixels.data[offset + 3] = 255;
      }
      context.putImageData(pixels, 0, 0);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      canvas.remove();
      canvasRef.current = null;
    };
  }, [text, layer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) canvas.style.opacity = hidden ? "0" : "1";
  }, [hidden]);

  return (
    <Text ref={ref} style={[style, { color: "transparent", opacity: hidden ? 0 : 1 }]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  track: {
    position: "absolute",
    left: 0,
    top: 0,
    flexDirection: "row",
  },
});
