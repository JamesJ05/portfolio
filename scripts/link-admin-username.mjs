/**
 * One-time script: link username "JamesJason" to an existing Firebase Auth account.
 *
 * Usage (PowerShell):
 *   $env:FIREBASE_API_KEY='...'; $env:ADMIN_EMAIL='you@example.com';
 *   $env:ADMIN_USERNAME='YourName'; $env:ADMIN_PASSWORD='...'; node scripts/link-admin-username.mjs
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: 'portpolio-8db8d.firebaseapp.com',
  projectId: 'portpolio-8db8d',
  messagingSenderId: '946827032872',
  appId: '1:946827032872:web:a30041a0bed6dc2159b81d'
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!firebaseConfig.apiKey || !ADMIN_EMAIL || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error('Set FIREBASE_API_KEY, ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD before running this script.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function normalizeUsername(u) {
  return u.trim().toLowerCase();
}

async function main() {
  const key = normalizeUsername(ADMIN_USERNAME);
  const usernameRef = doc(db, 'usernames', key);

  let user;
  try {
    const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    user = cred.user;
    console.log('Signed in to existing account.');
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      user = cred.user;
      console.log('Created new Firebase Auth account.');
    } else {
      throw err;
    }
  }

  await setDoc(usernameRef, {
    uid: user.uid,
    username: ADMIN_USERNAME
  });

  await setDoc(doc(db, 'users', user.uid), {
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    displayName: ADMIN_USERNAME,
    createdAt: serverTimestamp()
  }, { merge: true });

  console.log('Done.');
  console.log(`  Username: ${ADMIN_USERNAME}`);
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log('You can now log in with the email address.');
}

main().catch(err => {
  console.error('Failed:', err.message || err);
  process.exit(1);
});
