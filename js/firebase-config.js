import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

import {
  getFirestore
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnTpyW6yURDr3te8Sc7aJvWJaBt9azlhU",
  authDomain: "portpolio-8db8d.firebaseapp.com",
  projectId: "portpolio-8db8d",
  storageBucket: "portpolio-8db8d.firebasestorage.app",
  messagingSenderId: "946827032872",
  appId: "1:946827032872:web:a30041a0bed6dc2159b81d"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);