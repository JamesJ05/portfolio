const registerForm = document.getElementById('registerForm');
const authStatus = document.getElementById('authStatus');
const registerBtn = document.getElementById('registerBtn');

redirectIfAuthenticated();

registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = registerForm.username.value.trim();
  const displayName = registerForm.displayName.value.trim();
  const email = registerForm.email.value.trim();
  const password = registerForm.password.value;
  const confirmPassword = registerForm.confirmPassword.value;

  if (!validateUsername(username)) {
    setAuthStatus(authStatus, friendlyAuthError({ code: 'username-invalid' }), true);
    return;
  }

  if (password !== confirmPassword) {
    setAuthStatus(authStatus, 'Passwords do not match.', true);
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = 'Creating account…';
  setAuthStatus(authStatus, '');

  let cred = null;

  try {
    const available = await isUsernameAvailable(username);
    if (!available) {
      throw { code: 'username-taken', message: friendlyAuthError({ code: 'username-taken' }) };
    }

    cred = await auth.createUserWithEmailAndPassword(email, password);
    if (displayName) {
      await cred.user.updateProfile({ displayName });
    }
    await saveUsernameProfile(cred.user.uid, username, email, displayName);

    window.location.href = 'admin/dashboard.html';
  } catch (err) {
    console.error('Register error:', err);
    if (cred?.user) {
      try { await cred.user.delete(); } catch (_) { /* ignore cleanup failure */ }
    }
    setAuthStatus(authStatus, friendlyAuthError(err), true);
    registerBtn.disabled = false;
    registerBtn.textContent = 'Create account';
  }
});
