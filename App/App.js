import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { auth } from "./firebase";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";

export default function App() {
  const Stack = createNativeStackNavigator();

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
          options={{
            headerTitle: "Home",
            headerStyle: {
              backgroundColor: "#369399",
            },
            headerShadowVisible: true,
            headerTitleStyle: {
              fontSize: 21,
              fontWeight: "400",
              color: "lightgrey",
            },
            headerRight: () => <HomeScreenSignOutButton />,
          }}
          component={HomeScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function HomeScreenSignOutButton() {
  const navigation = useNavigation();

  const signoutHandler = () => {
    auth
      .signOut()
      .then(() => {
        navigation.replace("Login");
      })
      .catch((error) => alert(error.message));
  };

  return (
    <TouchableOpacity onPress={signoutHandler}>
      <Text style={{ color: "lightgrey", fontSize: 19 }}>Sign out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
