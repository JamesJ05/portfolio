/**
 * Shared auth helpers for login, register, and nav auth state.
 */
function friendlyAuthError(err) {
  const map = {
    'auth/email-already-in-use': 'That email is already registered — log in instead.',
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-not-found': 'No account found with that email address.',
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

async function isAdmin(uid) {
  return uid === ADMIN_UID;
}

function redirectIfAuthenticated() {
  auth.onAuthStateChanged(async user => {
    if (!user) return;
    const destination = await isAdmin(user.uid) ? 'admin/dashboard.html' : 'profile.html';
    window.location.href = destination;
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
 * Email-only sign-in avoids exposing an email lookup directory to the public.
 */
async function resolveLoginEmail(identifier) {
  const value = identifier.trim();
  if (!value) throw { code: 'auth/invalid-credential', message: 'Enter your email address.' };

  if (isEmail(value)) return value;
  throw { code: 'auth/invalid-credential', message: 'Sign in with your email address.' };
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
