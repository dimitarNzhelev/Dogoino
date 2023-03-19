import React, { useEffect, useState, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
  Image,
} from "react-native";
import { auth, firestore } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { Client, Message } from "paho-mqtt";
import { useFonts } from "expo-font";

export default function HomeScreen(props) {
  const { email } = props.route.params;
  const [collars, setCollars] = useState([]);
  const [image, setImage] = useState(require("../src/img/lock.png"));
  const [lockDoorColor, setLockDoorColor] = useState(false);

  const navigation = useNavigation();
  const location = props.route.params.location;
  const [loaded] = useFonts({
    "OpenSans-Medium": require("../assets/fonts/OpenSans-Medium.ttf"),
  });

  const styles = StyleSheet.create({
    container: {
      height: "60%",
    },
    listContainer: {
      margin: 40,
      marginBottom: 0,
      backgroundColor: "#369399",
      borderRadius: 20,

      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    headerContainer: {
      backgroundColor: "#045c62",
      padding: 4,
      paddingBottom: 10,
      paddingTop: 10,
      borderRadius: 20,
    },
    headerText: {
      fontSize: 18,
      marginLeft: 20,
      color: "lightgrey",
      fontFamily: loaded ? "OpenSans-Medium" : "System",
    },

    listTextContainer: {
      fontSize: 16,
      textAlign: "left",
      fontFamily: loaded ? "OpenSans-Medium" : "System",
    },
    statusContainer: {
      fontSize: 18,
      fontFamily: loaded ? "OpenSans-Medium" : "System",
      margin: 12,
      width: "25%",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "lightgrey",
      padding: 2,
    },
    deleteText: {
      fontSize: 16,
      color: "lightgrey",
      textAlign: "right",
      fontFamily: loaded ? "OpenSans-Medium" : "System",
      padding: 5,
    },
    idText: {
      fontSize: 14,
      textAlign: "right",
      marginRight: 20,
      fontFamily: loaded ? "OpenSans-Medium" : "System",
    },
    RegisterCollar: {
      padding: 10,
      width: 55,
      borderRadius: 100,
      borderWidth: 1,
      marginTop: 20,
      backgroundColor: "#045c62",
    },
    lockDoor: {
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "red",
      padding: 20,
      margin: 40,
      marginTop: 40,
      marginLeft: 40,
      marginRight: 40,
      borderRadius: 20,
    },
    buttonText: {
      fontSize: 18,
      color: "lightgrey",
      fontFamily: loaded ? "OpenSans-Medium" : "System",
    },
    button: {
      padding: 10,
      paddingBottom: 5,
      paddingTop: 3,
      margin: 0,
      marginRight: 15,
      color: "#369399",
      borderRadius: 100,
      borderWidth: 1,
      borderColor: "lightgrey",
    },
  });

  const signoutHandler = () => {
    auth
      .signOut()
      .then(() => {
        navigation.replace("Login");
      })
      .catch((error) => alert(error.message));
  };

  function AddCollar() {
    navigation.navigate("RegisterCollar", {
      email,
      location,
    });
  }

  async function getData() {
    try {
      const collRef = collection(firestore, "users", email, "collars");
      const querySnapshot = await getDocs(collRef);
      const mappedCollars = querySnapshot.docs.map((doc) => ({
        id: doc.data().id,
        name: doc.data().name,
        type: doc.data().type,
      }));
      return mappedCollars;
    } catch (error) {
      console.error(error);
    }
  }

  async function ChangeLockState() {
    const lockRef = doc(firestore, "users", email, "lock", "lockDoor");
    const lockDocSnap = await getDoc(lockRef);

    const lockValue = lockDocSnap.data().value;
    if (lockValue == "false") {
      await updateDoc(lockRef, { value: "true" });
    } else if (lockValue == "true") {
      await updateDoc(lockRef, { value: "false" });
    }
    toggleLockDoorColor();
  }

  function PressHandler(collar) {
    navigation.navigate("Product", { collar, email, location });
  }

  async function DeleteCollar(name) {
    try {
      const userDoc = await firestore.collection("users").doc(email).get();
      if (!userDoc.exists) {
        throw new Error(`User ${email} not found`);
      }

      const collarsRef = userDoc.ref.collection("collars");
      const querySnapshot = await collarsRef.where("name", "==", name).get();

      if (querySnapshot.empty) {
        throw new Error(`Collar ${name} not found for user ${email}`);
      }

      const batch = firestore.batch();
      querySnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      console.log(`Collar ${name} deleted for user ${email}`);
    } catch (error) {
      console.error(error);
    }
    navigation.replace("Home", {
      email: email,
      location: location,
    });
  }

  useEffect(() => {
    async function fetchCollars() {
      const collars = await getData();
      setCollars(collars);
    }
    fetchCollars();
    toggleLockDoorColor();
  }, []);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  async function toggleLockDoorColor() {
    const lockRef = doc(firestore, "users", email, "lock", "lockDoor");

    const lockDocSnap = await getDoc(lockRef);

    const lockValue = lockDocSnap.data().value;

    if (lockValue === "true") {
      setLockDoorColor("#045c62");
      setImage(require("../src/img/lock.png"));
    } else {
      setLockDoorColor("#369399");
      setImage(require("../src/img/unlock.png"));
    }

    const client = new Client(
      "broker.hivemq.com",
      Number(8000),
      "reactApplication"
    );

    if (lockValue === "true") {
      client.connect({
        onSuccess: () => {
          collars.map((collar) => {
            const message = new Message("1");
            message.destinationName = `${collar.id}/door`;
            client.send(message);
          });
        },
      });
    } else if (lockValue === "false") {
      client.connect({
        onSuccess: () => {
          collars.map((collar) => {
            const message = new Message("0");

            message.destinationName = `${collar.id}/door`;
            client.send(message);
          });
        },
      });
    }
  }

  return (
    <View style={{ backgroundColor: "#183e42", flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 20,
          paddingBottom: 10,
          paddingTop: 50,
          backgroundColor: "#369399",
          borderRadius: 15,
        }}
      >
        <Text
          style={[
            styles.headerText,
            {
              fontSize: 28,
              color: "lightgrey",
              fontFamily: loaded ? "OpenSans-Medium" : "System",
            },
          ]}
        >
          Home
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={[
              styles.button,
              { alignSelf: "flex-start", marginRight: 10 },
            ]}
            onPress={signoutHandler}
          >
            <Text style={styles.buttonText}>Sign out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { alignSelf: "flex-end", marginRight: 10 }]}
            onPress={AddCollar}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.container}>
        <ScrollView>
          {collars
            ? collars.map((collar, key) => (
                <Animated.View
                  key={key}
                  style={{ ...styles.listContainer, opacity: fadeAnim }}
                >
                  <Pressable onPress={() => PressHandler(collar)}>
                    <View style={styles.headerContainer}>
                      <Text style={styles.headerText}>{collar.name}</Text>
                    </View>
                  </Pressable>
                  <View style={{ alignItems: "flex-end" }}>
                    <Pressable onPress={() => DeleteCollar(collar.name)}>
                      <View style={styles.statusContainer}>
                        <Text style={styles.deleteText}>Delete</Text>
                      </View>
                    </Pressable>
                  </View>
                </Animated.View>
              ))
            : null}
        </ScrollView>
      </View>
      <Animated.View
        style={{
          opacity: fadeAnim,
          justifyContent: "center",
          alignItems: "center",
        }}
      ></Animated.View>
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          onPress={() => ChangeLockState()}
          style={{
            ...styles.lockDoor,
            backgroundColor: lockDoorColor,
          }}
        >
          <Image source={image} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
