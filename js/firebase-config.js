/**
 * Firebase config — compat SDK (loaded via CDN script tags in HTML).
 * Do NOT use ES module imports here; plain script tags load this file.
 */
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
