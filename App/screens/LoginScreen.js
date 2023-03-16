import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth } from "../firebase";
import { location } from "../getLocation";
console.log(location, "Login");

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigation = useNavigation();

  const LoginHandler = () => {
    auth
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        setEmail(user.email);
        navigation.replace("Home", {
          email: user.email,
          location: location,
        });
      })
      .catch((error) => {
        alert(error.message + ": " + error.code);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Login</Text>
      </View>
      <TextInput
        style={styles.textInput}
        placeholder="Email"
        onChangeText={(email) => setEmail(email)}
      />
      <TextInput
        style={styles.textInput}
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />

      <TouchableOpacity style={styles.loginButton} onPress={LoginHandler}>
        <Text style={{ color: "#fff", fontSize: 18 }}>Login</Text>
      </TouchableOpacity>
      <View style={styles.registerContainer}>
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            paddingTop: 0,
            textAlign: "center",
            fontFamily: "sans-seri",
          }}
        >
          If you don't have an account
        </Text>
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            paddingTop: 0,
            fontFamily: "sans-seri",
            textAlign: "center",
          }}
        >
          you can register here:
        </Text>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={{ color: "#fff", fontSize: 18 }}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#045c62",
  },

  textInput: {
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 6,
    fontSize: 20,
    fontFamily: "sans-serif",
    padding: 5,
    paddingLeft: 10,
    marginBottom: 10,
    backgroundColor: "white",
    width: "75%",
  },
  header: {
    marginBottom: "10%",
    marginTop: 250,
    alignItems: "center",
  },
  headerText: {
    fontSize: 28,
    color: "white",
    fontFamily: "sans-serif",
  },
  loginButton: {
    marginTop: "5%",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-seri",
    borderRadius: 6,
    backgroundColor: "#379799",
    padding: 10,
    width: "18%",
  },
  registerContainer: {
    marginTop: 150,
    alignItems: "center",
  },
  registerButton: {
    marginTop: "5%",
    fontFamily: "sans-serif",
    marginBottom: "20%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#379799",
    padding: 10,
    width: "25%",
  },
});
