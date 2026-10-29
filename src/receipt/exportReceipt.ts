import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { openReceiptPrint } from "@/web/iosWeb";

export async function exportReceipt(html: string): Promise<void> {
  if (Platform.OS === "web") {
    openReceiptPrint(html);
    return;
  }
  const file = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Este dispositivo no puede compartir el comprobante.");
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: "Comprobante HN Xpress",
  });
}
