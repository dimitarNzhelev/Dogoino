import * as Location from "expo-location";

let location = {
  latitude: null,
  longitude: null,
  latitudeDelta: 0.1122,
  longitudeDelta: 0.0721,
};

(async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    setErrorMsg("Permission to access location was denied");
    return;
  }

  let Currentlocation = await Location.getCurrentPositionAsync({});
  location = {
    latitude: Currentlocation.coords.latitude,
    longitude: Currentlocation.coords.longitude,
    latitudeDelta: 0.1122,
    longitudeDelta: 0.0721,
  };
  console.log(location, "In file");
})();

export { location };
