import { useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SessionProvider } from "@/auth/session";
import { RootNavigator } from "@/navigation/RootNavigator";
import { configureIosWebDocument } from "@/web/iosWeb";

export default function App() {
  useEffect(() => {
    if (Platform.OS === "web") configureIosWebDocument();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider
        settings={{
          icon: ({ name, color, size }) => (
            <MaterialCommunityIcons name={name} color={color} size={size} />
          ),
        }}
      >
        <SessionProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </SessionProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
