import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// User provided Firebase configuration for TransitOps
export const firebaseConfig = {
  apiKey: "AIzaSyBt89DqaDL_Kcf69uoP46Sbt1nhBplwXms",
  authDomain: "transitops-4fad1.firebaseapp.com",
  projectId: "transitops-4fad1",
  storageBucket: "transitops-4fad1.firebasestorage.app",
  messagingSenderId: "724628539673",
  appId: "1:724628539673:web:44c54de08f616e4dad9d88",
  measurementId: "G-BTHW5GNJLZ"
};

// Initialize Firebase SDK
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
