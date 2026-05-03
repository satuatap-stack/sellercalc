import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAWtAXlAHUkqBkXIko83WjZ5Vd2-ID7Lnw",
  authDomain: "sellercalc-490d8.firebaseapp.com",
  projectId: "sellercalc-490d8",
  storageBucket: "sellercalc-490d8.firebasestorage.app",
  messagingSenderId: "729591761569",
  appId: "1:729591761569:web:cd53e1508baa02473dbee0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();