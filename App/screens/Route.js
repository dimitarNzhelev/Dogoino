import { useNavigation } from "@react-navigation/native";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import MapView, { Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import BottomSheet from "./BottomSheet.js";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import { useFonts } from "expo-font";

export default function RouteScreen(props) {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const collar = props.route.params.collar;
  const email = props.route.params.email;
  const location = props.route.params.location;
  const polylineCoords = props.route.params.polylineCoords;
  const regionCenter = polylineCoords.length / 2;
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const region = {
    latitude: polylineCoords[regionCenter].latitude,
    longitude: polylineCoords[regionCenter].longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.005,
  };
  const [loaded] = useFonts({
    "OpenSans-Medium": require("../assets/fonts/OpenSans-Medium.ttf"),
  });

  const styles = StyleSheet.create({
    productContainer: {
      flex: 1,
      borderRadius: 10,
    },

    headerText: {
      fontSize: 28,
      marginLeft: 10,
      padding: 10,
      color: "lightgrey",
      fontFamily: loaded ? "OpenSans-Medium" : "System",
    },

    desContainer: {
      width: "100%",
      height: "100%",
    },

    buttonContainer: {
      position: "absolute",
      top: 20,
      right: 20,
      backgroundColor: "#fff",
      borderRadius: 5,
      padding: 10,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
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
    circle: {
      height: 20,
      width: 20,
      borderRadius: 100,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "black",
    },
    core: {
      height: 19,
      width: 19,
      borderRadius: 20,
      position: "relative",
      backgroundColor: "#369399",
    },

    buttonText: {
      fontSize: 18,
      color: "lightgrey",
      fontFamily: loaded ? "OpenSans-Medium" : "System",
    },
    bottomSheetContent: {
      padding: 40,
      marginTop: 10,
      alignItems: "center",
    },
    bottomSheetText: {
      fontSize: 21,
      marginBottom: 10,
      fontFamily: loaded ? "OpenSans-Medium" : "System",
      color: "lightgrey",
    },
    bottomSheetCloseButton: {
      marginTop: 10,
      padding: 16,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: "lightgrey",
      fontFamily: loaded ? "OpenSans-Medium" : "System",
    },
  });

  async function getLogs() {
    try {
      const dbinstance = collection(
        firestore,
        "users",
        email,
        "collars",
        collar.name,
        "logs"
      );
      const querySnapshot = await getDocs(dbinstance);
      const logs = querySnapshot.docs.map((doc) => doc.data());
      return logs;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  useEffect(() => {
    async function fetchLogs() {
      const logs = await getLogs();
      setLogs(logs);
    }
    fetchLogs();
  }, []);

  const hide = () => {
    setShowBottomSheet(false);
  };

  const GoHome = () => {
    navigation.replace("Home", { email: email, location: location });
  };

  const GoMap = () => {
    navigation.replace("Product", {
      email: email,
      location: location,
      collar: collar,
      polylineCoords: polylineCoords,
    });
  };

  return (
    <View style={styles.productContainer}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 40,
          borderRadius: 10,
          backgroundColor: "#369399",
        }}
      >
        <Text style={styles.headerText}>{collar.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={[styles.button, { alignSelf: "flex-end", marginRight: 10 }]}
            onPress={GoHome}
          >
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { alignSelf: "flex-end", marginRight: 10 }]}
            onPress={GoMap}
          >
            <Text style={styles.buttonText}>Go Map</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.desContainer}>
        <MapView
          showsUserLocation={true}
          showsIndoorLevelPicker={false}
          showsBuildings={false}
          onMapReady={() => {
            mapRef.current.animateToRegion(region, 0);
          }}
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          loadingEnabled={true}
          loadingIndicatorColor="#e21d1d"
          onMapError={(error) => console.log("Map error:", error)}
          style={{
            flex: 1,
            width: "100%",
            height: "90%",
          }}
        >
          <Polyline
            coordinates={polylineCoords}
            strokeWidth={2}
            strokeColor="#000"
          />
        </MapView>
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 130,
            justifyContent: "center",
            alignItems: "center",
            alignSelf: "center",
            marginBottom: 1,
          }}
          onPress={() => setShowBottomSheet(true)}
        >
          <Image source={require("../src/img/arrow.png")} />
        </TouchableOpacity>
      </View>
      <BottomSheet show={showBottomSheet} height={290} onOuterClick={hide}>
        <View style={styles.bottomSheetContent}>
          <ScrollView>
            {logs.map((log, key) => {
              const logValue = Object.values(log)[0];
              return (
                <Text key={key + 1} style={styles.bottomSheetText}>
                  Log {key + 1}: {logValue}
                </Text>
              );
            })}
          </ScrollView>
          <Pressable onPress={hide} style={styles.bottomSheetCloseButton}>
            <Text style={styles.buttonText}>X Close</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}
