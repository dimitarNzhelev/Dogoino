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
import { Message, Client } from "paho-mqtt";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import BottomSheet from "./BottomSheet.js";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase";
import Dog from "../Dog";
import { useFonts } from "expo-font";

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
  const [loaded] = useFonts({
    "OpenSans-Medium": require("../assets/fonts/OpenSans-Medium.ttf"),
  });

  const [logs, setLogs] = useState([]);
  const [polylineCoords, setPolyline] = useState();

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
      fontFamily: loaded ? "OpenSans-Medium" : "System",
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
      fontFamily: loaded ? "OpenSans-Medium" : "System",
    },
    bottomSheetText: {
      fontSize: 21,
      marginBottom: 10,
      color: "lightgrey",
      fontFamily: loaded ? "OpenSans-Medium" : "System",
    },
    bottomSheetCloseButton: {
      marginTop: 20,
      padding: 16,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: "lightgrey",
      fontFamily: loaded ? "OpenSans-Medium" : "System",
    },
  });

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
          <Text
            style={{
              fontSize: 26,
              color: "white",
              fontFamily: loaded ? "OpenSans-Medium" : "System",
            }}
          >
            Uploading GPS location...
          </Text>
        </View>
      );
    } else {
      return null;
    }
  }

  function CustomMarker({ collar }) {
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
      logs.sort((a, b) => {
        const timeA = getSecondsSinceMidnight(a.message.split(" ")[0]);
        const timeB = getSecondsSinceMidnight(b.message.split(" ")[0]);
        return timeB - timeA;
      });

      function getSecondsSinceMidnight(timeString) {
        const [hours, minutes, seconds] = timeString.split(":");
        return hours * 3600 + minutes * 60 + seconds;
      }
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

    const client = new Client(
      "broker.hivemq.com",
      Number(8000),
      "reactApplication"
    );

    client.connect({
      onSuccess: function () {
        client.subscribe(`${collar.id}/gps`);
        client.subscribe(`${collar.id}/receiveLoc`);
        var message = new Message("1");
        message.destinationName = `${collar.id}/awaitLoc`;
        client.send(message);
      },
      onFailure: function () {
        console.log("fail");
      },
    });
    client.onConnectionLost = function (responseObject) {
      console.log("Connection lost: " + responseObject.errorMessage);
    };
    setUserRegion(location);
    client.onMessageArrived = (message) => {
      if (message.destinationName == `${collar.id}/gps`) {
        const a = message.payloadString.split(", ");
        const newLat = parseFloat(a[0]);
        const newLon = parseFloat(a[1]);
        if (newLat && newLon != 0.0) {
          setView(false);
          updateCollarPosition(newLat, newLon);
        }
      } else if (message.destinationName == `${collar.id}/receiveLoc`) {
        const array = JSON.parse(message.payloadString);
        console.log(array);
        const polyline = array.map((location) => ({
          latitude: location.latitude,
          longitude: location.longitude,
        }));
        console.log(polyline);
        setPolyline(polyline);
      }
    };
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

  const GoRoute = () => {
    navigation.replace("Route", {
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
            onPress={GoRoute}
          >
            <Text style={styles.buttonText}>View Route</Text>
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
              height: "90%",
            }}
          >
            <CustomMarker collar={collar} />
          </MapView>
        )}
        <CustomText show={view} />
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 130,
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
          <ScrollView style={{ height: 130 }}>
            {logs.map((log, key) => {
              const logValue = Object.values(log)[0];
              return (
                <Text key={key + 1} style={styles.bottomSheetText}>
                  {logValue}
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
