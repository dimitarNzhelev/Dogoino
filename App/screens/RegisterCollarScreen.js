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
  const { email, location } = props.route.params;
  const [id, setid] = useState();
  const [name, setName] = useState();
  const [type, setType] = useState();

  const navigation = useNavigation();

  async function RegisterHandler() {
    try {
      await setDoc(doc(firestore, "users", email, "collars", name), {
        name: name,
        id: id,
        logs: [],
        type: type.toLowerCase(),
      });
      navigation.replace("Home", { email: email, location: location });
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
      <TextInput
        style={styles.textInput}
        placeholder="Dog, Cat, etc..."
        onChangeText={(type) => setType(type)}
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
    marginTop: 100,
    alignItems: "center",
  },
  headerText: {
    fontSize: 28,
    color: "white",
    fontFamily: "sans-serif",
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
