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
import Paho from "paho-mqtt";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import BottomSheet from "./BottomSheet.js";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import Dog from "../Dog";

function CustomText(props) {
  if (props.show) {
    return (
      <View
        style={{
          backgroundColor: "#369399",
          alignSelf: "center",
          position: "absolute",
          marginTop: 50,
          padding: 10,
          borderRadius: 20,
        }}
      >
        <Text style={{ fontSize: 26, color: "white" }}>
          Uploading GPS location...
        </Text>
      </View>
    );
  } else {
    return null;
  }
}

export default function ProductPage(props) {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const collar = props.route.params.collar;
  const email = props.route.params.email;
  const location = props.route.params.location;
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const [view, setView] = useState(true);
  const [userRegion, setUserRegion] = useState(location);
  const [collarRegion, setCollarRegion] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [logs, setLogs] = useState([]);

  function CustomMarker({ collar }) {
    console.log(collar.type);
    if (collar.type === "cat") {
      return (
        <Marker
          coordinate={collarRegion}
          title={collar.name}
          width={60}
          height={60}
          icon={require("../src/img/cat.png")}
        />
      );
    } else if (collar.type === "dog") {
      return (
        <Marker coordinate={collarRegion} title={collar.name}>
          <View>
            <Dog />
          </View>
        </Marker>
      );
    } else {
      return (
        <Marker coordinate={collarRegion} title={collar.name}>
          <View style={styles.core} />
        </Marker>
      );
    }
  }

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
      console.log(logs);
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

    const client = new Paho.Client(
      "broker.hivemq.com",
      Number(8000),
      "reactApplication"
    );

    client.connect({
      onSuccess: function () {
        console.log("connected");
        client.subscribe(`${collar.id}/gps`);
      },
      onFailure: function () {
        console.log("fail");
      },
    });
    setUserRegion(location);
    console.log("location ", location);
    client.onMessageArrived = (message) => {
      const a = message.payloadString.split(", ");
      const newLat = parseFloat(a[0]);
      const newLon = parseFloat(a[1]);
      if (newLat && newLon != 0.0) {
        setView(false);
        updateCollarPosition(newLat, newLon);
      }
    };
    console.log("Map Center Region", userRegion);
  }, [location]);

  const updateCollarPosition = (newLat, newLon) => {
    const newRegion = {
      latitude: newLat,
      longitude: newLon,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
    setCollarRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  const hide = () => {
    setShowBottomSheet(false);
  };

  const GoHome = () => {
    navigation.replace("Home", { email: email, location: location });
  };

  return (
    <View style={styles.productContainer}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
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
        </View>
      </View>
      <View style={styles.desContainer}>
        {userRegion.latitude && userRegion.longitude && (
          <MapView
            showsUserLocation={true}
            showsIndoorLevelPicker={false}
            showsBuildings={false}
            ref={mapRef}
            region={userRegion}
            provider={PROVIDER_GOOGLE}
            loadingEnabled={true}
            loadingIndicatorColor="#e21d1d"
            onMapError={(error) => console.log("Map error:", error)}
            style={{
              flex: 1,
              width: "100%",
            }}
          >
            <CustomMarker collar={collar} />
          </MapView>
        )}
        <CustomText show={view} />
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 100,
            justifyContent: "center",
            alignItems: "center",
            alignSelf: "center",
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

const styles = StyleSheet.create({
  productContainer: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: "#369399",
  },

  headerText: {
    fontSize: 28,
    marginLeft: 10,
    padding: 10,
    color: "lightgrey",
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
  },
  bottomSheetContent: {
    padding: 40,
    marginTop: 10,
    alignItems: "center",
  },
  bottomSheetText: {
    fontSize: 21,
    marginBottom: 10,
  },
  bottomSheetCloseButton: {
    marginTop: 10,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 20,
  },
});
