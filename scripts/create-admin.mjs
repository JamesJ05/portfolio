const API_KEY = 'AIzaSyBnTpyW6yURDr3te8Sc7aJvWJaBt9azlhU';
const email = 'jamesstephen.m.jason@gmail.com';
const password = 'Admin2001';
const displayName = 'JamesJason';

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
