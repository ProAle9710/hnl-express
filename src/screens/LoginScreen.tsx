import { useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Sheet } from "@/components/Sheet";
import { WaveBackdrop } from "@/components/WaveBackdrop";
import { auth } from "@/firebase/client";
import { type } from "@/theme";

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const wide = width >= 720;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setBusy(false);
    }
  }

  const ready = email.includes("@") && password.length >= 6;

  const form = (
    <>
      <Field label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label={busy ? "Entrando…" : "Continuar"} disabled={!ready || busy} onPress={() => void submit()} />
    </>
  );

  const brand = (
    <View style={[styles.brand, wide ? null : styles.brandMobile]}>
      <View style={styles.logo}>
        <Text style={styles.logoHint}>LOGO</Text>
        <Text style={styles.logoFile}>logo.png</Text>
      </View>
      <Text style={styles.mark}>HNL</Text>
      <Text style={styles.word}>EXPRESS</Text>
      <Text style={styles.tag}>Acceso interno</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <WaveBackdrop />
      {wide ? (
        <View style={[styles.desktop, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          {brand}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Entrar</Text>
            {form}
          </View>
        </View>
      ) : (
        <View style={[styles.mobile, { paddingTop: insets.top + 28 }]}>
          {brand}
          <Sheet visible scrim={false} title="Entrar">
            {form}
          </Sheet>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#071018" },
  desktop: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 72,
    paddingHorizontal: 48,
  },
  mobile: { flex: 1, alignItems: "center" },
  card: {
    width: 420,
    backgroundColor: "#F7F4EE",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  cardTitle: { ...type.title2, marginBottom: 12 },
  brand: { alignItems: "flex-start", maxWidth: 420 },
  brandMobile: { alignItems: "center" },
  logo: {
    width: 112,
    height: 112,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(244,239,230,0.55)",
    backgroundColor: "rgba(7,16,24,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logoHint: { ...type.headline, color: "#F4EFE6", letterSpacing: 2 },
  logoFile: { ...type.caption, color: "rgba(244,239,230,0.6)", marginTop: 4 },
  mark: { ...type.largeTitle, color: "#F4EFE6", fontSize: 64, lineHeight: 68, textAlign: "center" },
  word: { ...type.title2, color: "#D7C4A3", letterSpacing: 8, marginTop: 4, fontSize: 28, textAlign: "center" },
  tag: { ...type.footnote, color: "rgba(244,239,230,0.72)", marginTop: 12 },
  error: { ...type.footnote, color: "#FF3B30", marginBottom: 8 },
});