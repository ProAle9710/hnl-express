import { useState } from "react";
import { Alert, Image, Platform, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { hig, type } from "@/theme";
import type { ReceiptStackParamList } from "@/navigation/types";
import { PickCanceled, pickImageFile } from "@/web/iosWeb";

type Props = NativeStackScreenProps<ReceiptStackParamList, "Captura">;

async function ensurePermission(kind: "camera" | "library"): Promise<boolean> {
  const request =
    kind === "camera"
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
  const result = await request();
  if (result.granted) return true;
  Alert.alert(
    "Permiso requerido",
    kind === "camera"
      ? "Activa el permiso de cámara para fotografiar el comprobante."
      : "Activa el permiso de fotos para elegir el comprobante.",
  );
  return false;
}

export function CaptureScreen({ navigation }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pickOnWeb(source: "camera" | "library") {
    setBusy(true);
    pickImageFile(source === "camera")
      .then((image) => {
        setPreview(image.uri);
        navigation.navigate("Revision", {
          imageBase64: image.base64,
          mimeType: image.mimeType,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof PickCanceled) return;
        const message = error instanceof Error ? error.message : "No se pudo leer la imagen.";
        window.alert(message);
      })
      .finally(() => setBusy(false));
  }

  async function pick(source: "camera" | "library") {
    if (Platform.OS === "web") {
      pickOnWeb(source);
      return;
    }
    const allowed = await ensurePermission(source);
    if (!allowed) return;
    setBusy(true);
    try {
      const launch =
        source === "camera" ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
      const result = await launch({
        mediaTypes: ["images"],
        base64: true,
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        throw new Error("La imagen no incluyó datos para el análisis.");
      }
      setPreview(asset.uri);
      navigation.navigate("Revision", {
        imageBase64: asset.base64,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo leer la imagen.";
      Alert.alert("Imagen", message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Comprobante" subtitle="Foto o archivo del comprobante original.">
      <View style={styles.preview}>
        {preview ? (
          <Image source={{ uri: preview }} style={styles.image} accessibilityLabel="Vista previa" />
        ) : (
          <Text style={styles.hint}>Aún no hay imagen.</Text>
        )}
      </View>
      <View style={styles.actions}>
        <Button label="Tomar foto" disabled={busy} onPress={() => void pick("camera")} />
        <Button
          label="Elegir de galería"
          tone="plain"
          disabled={busy}
          onPress={() => void pick("library")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    flex: 1,
    minHeight: 220,
    borderRadius: 14,
    backgroundColor: hig.cell,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  hint: {
    ...type.footnote,
  },
  actions: {
    marginTop: 16,
    gap: 4,
  },
});
