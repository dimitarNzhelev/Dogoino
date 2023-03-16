import { LogBox } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import ProductInformation from "./screens/ProductInformation";
import RegisterScreen from "./screens/RegisterPage";
import RegisterCollar from "./screens/RegisterCollarScreen";
import React, { useState, useEffect } from "react";
import useLocation from "./getLocation";
import RouteScreen from "./screens/Route";

const Stack = createNativeStackNavigator();

export default function App() {
  const [location, setLocation] = useState(null);
  LogBox.ignoreAllLogs();

  useEffect(() => {
    async function fetchLocation() {
      const locationData = await useLocation();
      setLocation(locationData);
    }
    fetchLocation();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          options={{ headerShown: false }}
          name="Login"
          component={LoginScreen}
        />
        <Stack.Screen
          name="Home"
          options={{ headerShown: false }}
          component={HomeScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Product"
          component={ProductInformation}
          initialParams={{ location }}
        />

        <Stack.Screen
          options={{ headerShown: false }}
          name="Register"
          component={RegisterScreen}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="RegisterCollar"
          component={RegisterCollar}
        />
        <Stack.Screen
          options={{ headerShown: false }}
          name="Route"
          component={RouteScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
