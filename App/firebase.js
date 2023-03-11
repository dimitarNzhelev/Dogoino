import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCgZ1rql5dUiBfFXqzjKVri0wR0OdtzRig",
  authDomain: "loginauth-5aa1e.firebaseapp.com",
  projectId: "loginauth-5aa1e",

  storageBucket: "loginauth-5aa1e.appspot.com",
  messagingSenderId: "324796647216",
  appId: "1:324796647216:web:6ef197e6f66fc28e92eaf5",
  measurementId: "G-XMD77QFBFV",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();
const users = firestore.collection("users");

export { auth, firestore, users };
