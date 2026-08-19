/**
 * Shared auth helpers for login, register, and nav auth state.
 */
function friendlyAuthError(err) {
  const map = {
    'auth/email-already-in-use': 'That email is already registered — log in instead.',
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-not-found': 'No account found with that username or email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect username/email or password.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'username-taken': 'That username is already taken — try another one.',
    'username-invalid': 'Username must be 3–20 characters: letters, numbers, and underscores only.',
    'username-not-found': 'No account found with that username.'
  };
  return map[err.code] || err.message;
}

function setAuthStatus(el, msg, isError = false) {
  if (!el) return;
  el.textContent = msg;
  el.className = 'form-status ' + (isError ? 'err' : msg ? 'ok' : '');
}

function redirectIfAuthenticated(dashboardPath = 'admin/dashboard.html') {
  auth.onAuthStateChanged(user => {
    if (user) window.location.href = dashboardPath;
  });
}

function normalizeUsername(username) {
  return String(username).trim().toLowerCase();
}

function validateUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(String(username).trim());
}

function isEmail(value) {
  return String(value).includes('@');
}

/**
 * Resolves a login identifier (username or email) to the Firebase auth email.
 */
async function resolveLoginEmail(identifier) {
  const value = identifier.trim();
  if (!value) throw { code: 'auth/invalid-credential', message: 'Enter your username or email.' };

  if (isEmail(value)) return value;

  const key = normalizeUsername(value);
  const snap = await db.collection('usernames').doc(key).get();
  if (!snap.exists) throw { code: 'username-not-found', message: friendlyAuthError({ code: 'username-not-found' }) };

  const data = snap.data();
  if (!data.email) throw { code: 'username-not-found', message: friendlyAuthError({ code: 'username-not-found' }) };
  return data.email;
}

/**
 * Checks whether a username is available before registration.
 */
async function isUsernameAvailable(username) {
  const key = normalizeUsername(username);
  const snap = await db.collection('usernames').doc(key).get();
  return !snap.exists;
}

/**
 * Saves username ↔ user mapping after Firebase Auth account creation.
 */
async function saveUsernameProfile(uid, username, email, displayName) {
  const key = normalizeUsername(username);
  const usernameRef = db.collection('usernames').doc(key);
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (tx) => {
    const existing = await tx.get(usernameRef);
    if (existing.exists) {
      throw { code: 'username-taken', message: friendlyAuthError({ code: 'username-taken' }) };
    }
    tx.set(usernameRef, {
      uid,
      email,
      username: username.trim()
    });
    tx.set(userRef, {
      username: username.trim(),
      email,
      displayName: displayName || username.trim(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
}
