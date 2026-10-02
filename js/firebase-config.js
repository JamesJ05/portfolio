/** Firebase compat SDK configuration (the pages load compat scripts via CDN). */
const firebaseConfig = {
  apiKey: "AIzaSyBnTpyW6yURDr3te8Sc7aJvWJaBt9azlhU",
  authDomain: "portpolio-8db8d.firebaseapp.com",
  projectId: "portpolio-8db8d",
  // Set this to the bucket name shown in Firebase Console > Storage.
  // New default buckets are commonly named "<project-id>.firebasestorage.app".
  storageBucket: "portpolio-8db8d.firebasestorage.app",
  messagingSenderId: "946827032872",
  appId: "1:946827032872:web:a30041a0bed6dc2159b81d",
  measurementId: "G-BFGLWZ9PZW"
};

// The Firebase Auth UID allowed to manage portfolio content.
const ADMIN_UID = 'rP1WB49XocUXsHSk5m7SIP98DZy2';

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
