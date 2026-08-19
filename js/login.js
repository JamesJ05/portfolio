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
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = 'admin/dashboard.html';
  } catch (err) {
    console.error('Login error:', err);
    setAuthStatus(authStatus, friendlyAuthError(err), true);
    loginBtn.disabled = false;
    loginBtn.textContent = 'Log in';
  }
});
