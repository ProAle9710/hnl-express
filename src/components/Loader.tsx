import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { hig } from "@/theme";

const ARCS = [
  { color: hig.yellow, rotate: -20 },
  { color: hig.blue, rotate: 70 },
  { color: hig.red, rotate: 160 },
  { color: hig.navy, rotate: 250 },
] as const;

export function BrandSpinner({ size = 44 }: { size?: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        {ARCS.map((arc) => (
          <Circle
            key={arc.color}
            cx="20"
            cy="20"
            r="14"
            fill="none"
            stroke={arc.color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="16 72"
            transform={`rotate(${arc.rotate} 20 20)`}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

export function Loader() {
  return (
    <View style={styles.box} accessibilityLabel="Cargando">
      <BrandSpinner />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 120 },
});
