// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Reemplaza esto con tus datos reales de la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC4FkbEdJw8jzymu6a0vBiqfxSImsxkSOQ",
  authDomain: "dmkinesio-75699.firebaseapp.com",
  projectId: "dmkinesio-75699",
  storageBucket: "dmkinesio-75699.firebasestorage.app",
  messagingSenderId: "482521941594",
  appId: "1:482521941594:web:8542f1f0a345f388f23a63"
};

// Inicializa Firebase evitando que se duplique al recargar la página en desarrollo
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);