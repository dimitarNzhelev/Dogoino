import firebase from "firebase/compat/app";
import "firebase/compat/auth"; // add this import
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgZ1rql5dUiBfFXqzjKVri0wR0OdtzRig",
  authDomain: "loginauth-5aa1e.firebaseapp.com",
  projectId: "loginauth-5aa1e",

  storageBucket: "loginauth-5aa1e.appspot.com",
  messagingSenderId: "324796647216",
  appId: "1:324796647216:web:6ef197e6f66fc28e92eaf5",
  measurementId: "G-XMD77QFBFV",
};
let app = {};
!firebase.apps.length
  ? (app = firebase.initializeApp(firebaseConfig))
  : (app = firebase.app());
const auth = firebase.auth(app);
const firestore = getFirestore(app);

export { auth, firestore };
