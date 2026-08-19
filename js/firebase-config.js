/**
 * FIREBASE CONFIG
 * -----------------------------------------------------------
 * 1. Go to https://console.firebase.google.com → create a project.
 * 2. Project settings → General → "Your apps" → Add app → Web (</>).
 * 3. Copy the config object Firebase gives you and paste it below.
 * 4. In the Firebase console, enable:
 *      - Authentication → Sign-in method → Email/Password
 *      - Firestore Database → Create database (start in production mode)
 * 5. See ../README.md for the Firestore security rules to paste in.
 * -----------------------------------------------------------
 */
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyBnTpyW6yURDr3te8Sc7aJvWJaBt9azlhU",
  authDomain: "portpolio-8db8d.firebaseapp.com",
  projectId: "portpolio-8db8d",
  storageBucket: "portpolio-8db8d.firebasestorage.app",
  messagingSenderId: "946827032872",
  appId: "1:946827032872:web:a30041a0bed6dc2159b81d",
  measurementId: "G-BFGLWZ9PZW"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
