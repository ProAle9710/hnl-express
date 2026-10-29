import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useSession } from "@/auth/session";
import type { ReceiptStackParamList, TabParamList } from "@/navigation/types";
import { CaptureScreen } from "@/screens/CaptureScreen";
import { ClientsScreen } from "@/screens/ClientsScreen";
import { DayScreen } from "@/screens/DayScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { ProfitScreen } from "@/screens/ProfitScreen";
import { ReviewScreen } from "@/screens/ReviewScreen";
import { hig } from "@/theme";
import { ActivityIndicator, Text, View } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/client";
import { Button } from "@/components/Button";

const Stack = createNativeStackNavigator<ReceiptStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: hig.grouped,
    primary: hig.blue,
    card: "#F9F9F9",
    text: hig.label,
    border: hig.separator,
  },
};

function ReceiptStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: hig.blue,
        headerTitleStyle: { fontFamily: hig.font, fontSize: 17, fontWeight: "600" },
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen name="Captura" component={CaptureScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Revision" component={ReviewScreen} options={{ title: "Datos" }} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const { ready, user, staff, error } = useSession();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: hig.grouped }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!user) return <LoginScreen />;
  if (!staff) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: hig.grouped }}>
        <Text style={{ color: hig.label, fontSize: 17, marginBottom: 12 }}>
          {error || "Este usuario no está habilitado."}
        </Text>
        <Button label="Salir" onPress={() => void signOut(auth)} />
      </View>
    );
  }
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: hig.navy,
          tabBarInactiveTintColor: hig.secondary,
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: hig.separator,
            minHeight: 49,
          },
          tabBarLabelStyle: { fontFamily: hig.font, fontSize: 10 },
        }}
      >
        <Tab.Screen
          name="Clientes"
          component={ClientsScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Comprobante"
          component={ReceiptStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Ganancias"
          component={ProfitScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calculator-outline" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Jornada"
          component={DayScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="today-outline" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
