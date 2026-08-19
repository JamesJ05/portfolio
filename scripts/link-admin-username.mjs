/**
 * One-time script: link username "JamesJason" to an existing Firebase Auth account.
 *
 * Usage (set your admin email if different):
 *   node scripts/link-admin-username.mjs
 *
 * Or with env vars:
 *   ADMIN_EMAIL=you@email.com ADMIN_USERNAME=JamesJason ADMIN_PASSWORD=Admin2001 node scripts/link-admin-username.mjs
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
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBnTpyW6yURDr3te8Sc7aJvWJaBt9azlhU',
  authDomain: 'portpolio-8db8d.firebaseapp.com',
  projectId: 'portpolio-8db8d',
  storageBucket: 'portpolio-8db8d.firebasestorage.app',
  messagingSenderId: '946827032872',
  appId: '1:946827032872:web:a30041a0bed6dc2159b81d'
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'jamesstephen.m.jason@gmail.com';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'JamesJason';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin2001';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function normalizeUsername(u) {
  return u.trim().toLowerCase();
}

async function main() {
  const key = normalizeUsername(ADMIN_USERNAME);
  const usernameRef = doc(db, 'usernames', key);

  const existing = await getDoc(usernameRef);
  if (existing.exists()) {
    console.log(`Username "${ADMIN_USERNAME}" is already linked.`);
    return;
  }

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
    email: ADMIN_EMAIL,
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
  console.log('You can now log in with the username or email.');
}

main().catch(err => {
  console.error('Failed:', err.message || err);
  process.exit(1);
});
