const loginForm = document.getElementById('loginForm');
const authStatus = document.getElementById('authStatus');
const loginBtn = document.getElementById('loginBtn');

redirectIfAuthenticated();

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const identifier = loginForm.identifier.value.trim();
  const password = loginForm.password.value;

  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';
  setAuthStatus(authStatus, '');

  try {
    const email = await resolveLoginEmail(identifier);
    const credential = await auth.signInWithEmailAndPassword(email, password);
    window.location.href = await isAdmin(credential.user.uid) ? 'admin/dashboard.html' : 'profile.html';
  } catch (err) {
    setAuthStatus(authStatus, friendlyAuthError(err), true);
    loginBtn.disabled = false;
    loginBtn.textContent = 'Log in';
  }
});
