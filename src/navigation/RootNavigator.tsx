import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useSession } from "@/auth/session";
import type { ReceiptStackParamList, TabParamList } from "@/navigation/types";
import { CaptureScreen } from "@/screens/CaptureScreen";
import { ClientsScreen } from "@/screens/ClientsScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { ProfitScreen } from "@/screens/ProfitScreen";
import { ReviewScreen } from "@/screens/ReviewScreen";
import { hig } from "@/theme";
import { Text, View } from "react-native";
import { AppLayout } from "@/components/AppLayout";
import { Loader } from "@/components/Loader";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/client";
import { Button } from "@/components/Button";

const Stack = createNativeStackNavigator<ReceiptStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
    primary: hig.blue,
    card: "transparent",
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
        contentStyle: { backgroundColor: "transparent" },
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
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <Loader />
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
        <Button label="Cerrar sesión" onPress={() => void signOut(auth)} />
      </View>
    );
  }
  return (
    <NavigationContainer theme={navTheme}>
      <AppLayout>
      <Tab.Navigator
        initialRouteName="Panel"
        screenOptions={{
          headerShown: false,
          freezeOnBlur: true,
          lazy: true,
          sceneStyle: { backgroundColor: "transparent" },
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
          name="Panel"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} />,
          }}
        />
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
      </Tab.Navigator>
      </AppLayout>
    </NavigationContainer>
  );
}
