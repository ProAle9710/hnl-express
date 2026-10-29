import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";

const driver = Platform.OS !== "web";

export function WaveBackdrop() {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 8000, useNativeDriver: driver }),
        Animated.timing(drift, { toValue: 0, duration: 8000, useNativeDriver: driver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const shift = drift.interpolate({ inputRange: [0, 1], outputRange: [-36, 36] });
  const lift = drift.interpolate({ inputRange: [0, 1], outputRange: [12, -24] });

  return (
    <View style={styles.fill} pointerEvents="none">
      <Animated.View style={[styles.blob, styles.deep, { transform: [{ translateX: shift }, { translateY: lift }] }]} />
      <Animated.View style={[styles.blob, styles.mid, { transform: [{ translateX: Animated.multiply(shift, -1) }, { translateY: shift }] }]} />
      <Animated.View style={[styles.blob, styles.edge, { transform: [{ translateY: lift }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#10283A",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
  deep: {
    width: 520,
    height: 280,
    backgroundColor: "#071018",
    left: -80,
    top: 80,
  },
  mid: {
    width: 640,
    height: 320,
    backgroundColor: "#0A1824",
    right: -160,
    top: 220,
  },
  edge: {
    width: 720,
    height: 260,
    backgroundColor: "#0C1C2A",
    left: -40,
    bottom: 40,
  },
});
