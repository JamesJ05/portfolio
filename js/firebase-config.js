/** Firebase compat SDK configuration (the pages load compat scripts via CDN). */
const firebaseConfig = {
  apiKey: "AIzaSyBnTpyW6yURDr3te8Sc7aJvWJaBt9azlhU",
  authDomain: "portpolio-8db8d.firebaseapp.com",
  projectId: "portpolio-8db8d",
  messagingSenderId: "946827032872",
  appId: "1:946827032872:web:a30041a0bed6dc2159b81d",
  measurementId: "G-BFGLWZ9PZW"
};

// The Firebase Auth UID allowed to manage portfolio content.
const ADMIN_UID = 'rP1WB49XocUXsHSk5m7SIP98DZy2';

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
