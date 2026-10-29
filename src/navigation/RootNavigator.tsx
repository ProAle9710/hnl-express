import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { ReceiptStackParamList, TabParamList } from "@/navigation/types";
import { CaptureScreen } from "@/screens/CaptureScreen";
import { DayScreen } from "@/screens/DayScreen";
import { ProfitScreen } from "@/screens/ProfitScreen";
import { ReviewScreen } from "@/screens/ReviewScreen";
import { hig } from "@/theme";

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
        headerStyle: { backgroundColor: hig.grouped },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: hig.grouped },
      }}
    >
      <Stack.Screen name="Captura" component={CaptureScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Revision" component={ReviewScreen} options={{ title: "Datos" }} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: hig.blue,
          tabBarInactiveTintColor: hig.secondary,
          tabBarStyle: {
            backgroundColor: "rgba(249,249,249,0.94)",
            borderTopColor: hig.separator,
            minHeight: 49,
          },
          tabBarLabelStyle: { fontFamily: hig.font, fontSize: 10 },
        }}
      >
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
