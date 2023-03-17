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
import { useFonts } from "expo-font";
import { collection, addDoc } from "firebase/firestore";

function RegisterCollar(props) {
  const { email, location } = props.route.params;
  const [id, setid] = useState();
  const [name, setName] = useState();
  const [type, setType] = useState();
  const [loaded] = useFonts({
    "OpenSans-Medium": require("../assets/fonts/OpenSans-Medium.ttf"),
  });
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
      fontFamily: loaded ? "OpenSans-Medium" : "System",
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
      fontFamily: loaded ? "OpenSans-Medium" : "System",
    },
    registerButton: {
      marginTop: "5%",
      fontFamily: loaded ? "OpenSans-Medium" : "System",
      marginBottom: "20%",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
      backgroundColor: "#379799",
      padding: 10,
      width: "25%",
    },
  });

  const navigation = useNavigation();

  async function RegisterHandler() {
    try {
      const collarDocRef = doc(firestore, "users", email, "collars", name);
      await setDoc(collarDocRef, {
        name: name,
        id: id,
        type: type.toLowerCase(),
      });
      const logsCollectionRef = collection(collarDocRef, "logs");
      await addDoc(logsCollectionRef, {
        message: "Collar registered",
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
