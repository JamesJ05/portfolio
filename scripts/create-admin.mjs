const API_KEY = process.env.FIREBASE_API_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const displayName = process.env.ADMIN_DISPLAY_NAME || 'Admin';

if (!API_KEY || !email || !password) {
  console.error('Set FIREBASE_API_KEY, ADMIN_EMAIL, and ADMIN_PASSWORD before running this script.');
  process.exit(1);
}

async function createOrSignIn() {
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`;

  let res = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  let data = await res.json();

  if (data.error?.message === 'EMAIL_EXISTS') {
    res = await fetch(signInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    data = await res.json();
    if (data.error) {
      console.error('Account exists but password mismatch:', data.error.message);
      process.exit(1);
    }
    console.log('Account already exists — signed in successfully.');
  } else if (data.error) {
    console.error('Sign up failed:', data.error.message);
    process.exit(1);
  } else {
    console.log('Admin account created successfully.');
  }

  if (data.idToken) {
    await fetch(updateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: data.idToken, displayName, returnSecureToken: false })
    });
    console.log(`Display name set to: ${displayName}`);
  }

  console.log(`Login email: ${email}`);
  console.log('Password: (as provided)');
}

createOrSignIn();
