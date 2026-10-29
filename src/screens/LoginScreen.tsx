import { useRef, useState } from "react";
import { Image, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Sheet } from "@/components/Sheet";
import { WaveBackdrop, WaveWord } from "@/components/WaveBackdrop";
import { auth } from "@/firebase/client";
import { hig, type } from "@/theme";

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);
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
      <Field
        label="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Field
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        inputRef={passwordRef}
        returnKeyType="go"
        onSubmitEditing={() => {
          if (ready && !busy) void submit();
        }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label={busy ? "Entrando…" : "Continuar"} disabled={!ready || busy} loading={busy} onPress={() => void submit()} />
    </>
  );

  const band = height * 0.52 - insets.top;
  const logoSize = Math.min(band * 0.46, width * 0.42);
  const brand = wide ? (
    <View style={styles.brand}>
      <Image source={require("../../assets/logo-primary.png")} style={styles.logo} accessibilityLabel="HNL Xpress" />
      <Text style={styles.mark}>HNL</Text>
      <WaveWord text="XPRESS" style={styles.word} />
      <WaveWord text="Acceso interno" style={[styles.tag, { color: hig.blue }]} />
    </View>
  ) : (
    <View style={[styles.brandMobile, { height: band }]}>
      <Image
        source={require("../../assets/logo-primary.png")}
        style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }}
        accessibilityLabel="HNL Xpress"
      />
      <Text style={[styles.mark, { fontSize: band * 0.16, lineHeight: band * 0.17, marginTop: band * 0.03 }]}>HNL</Text>
      <WaveWord text="XPRESS" style={[styles.word, { fontSize: band * 0.075, lineHeight: band * 0.09, letterSpacing: band * 0.012, marginTop: 0 }]} />
      <WaveWord text="Acceso interno" style={[styles.tag, { marginTop: band * 0.02, fontSize: band * 0.045, color: hig.blue }]} />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
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
        <View style={[styles.mobile, { paddingTop: insets.top }]}>
          {brand}
          <Sheet visible scrim={false} title="Entrar" maxHeight="48%">
            {form}
          </Sheet>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F9FC" },
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
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  cardTitle: { ...type.title2, marginBottom: 12 },
  brand: { alignItems: "flex-start", maxWidth: 420 },
  brandMobile: { width: "100%", alignItems: "center", justifyContent: "center" },
  logo: {
    width: 132,
    height: 132,
    borderRadius: 66,
    marginBottom: 18,
  },
  mark: { ...type.largeTitle, color: hig.navy, fontSize: 64, lineHeight: 68, textAlign: "center" },
  word: { ...type.title2, color: hig.blue, letterSpacing: 8, marginTop: 4, fontSize: 28, textAlign: "center" },
  tag: { ...type.footnote, color: "#5C6770", marginTop: 12 },
  error: { ...type.footnote, color: hig.red, marginBottom: 8 },
});