import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { setDoc, doc } from "firebase/firestore";
import { firestore } from "../firebase";

function RegisterCollar(props) {
  const { email } = props.route.params;
  const [id, setid] = useState();
  const [name, setName] = useState();

  const navigation = useNavigation();

  async function RegisterHandler() {
    try {
      await setDoc(doc(firestore, "users", email, "collars", name), {
        name: name,
        id: id,
        status: "offline",
      });
      navigation.replace("Home", { email: email });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Register Collar</Text>
      </View>
      <TextInput
        style={styles.textInput}
        placeholder="Collar Name"
        onChangeText={(name) => setName(name)}
      />
      <TextInput
        style={styles.textInput}
        placeholder="Collar Id"
        onChangeText={(id) => setid(id)}
      />

      <TouchableOpacity style={styles.registerButton} onPress={RegisterHandler}>
        <Text style={{ color: "#fff", fontSize: 18 }}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

export default RegisterCollar;

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
    fontSize: 24,
    paddingLeft: 10,
    marginBottom: 10,
    backgroundColor: "white",
    width: "75%",
  },
  header: {
    marginBottom: "10%",
    alignItems: "center",
  },
  headerText: {
    fontSize: 28,
    color: "white",
  },
  registerButton: {
    marginTop: "5%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#379799",
    padding: 10,
    width: "25%",
  },
});
