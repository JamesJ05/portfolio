/** Firebase sends and validates the password reset token in the email link. */
(function forgotPassword() {
  const loginForm = document.getElementById('loginForm');
  const resetForm = document.getElementById('resetPasswordForm');
  const openButton = document.getElementById('forgotPasswordBtn');
  const backButton = document.getElementById('backToLoginBtn');
  const status = document.getElementById('resetStatus');
  const submitButton = document.getElementById('resetPasswordBtn');
  if (!loginForm || !resetForm || !openButton || !backButton) return;

  function showResetForm() {
    loginForm.hidden = true;
    resetForm.hidden = false;
    resetForm.elements.resetEmail.focus();
  }

  function showLoginForm() {
    resetForm.hidden = true;
    loginForm.hidden = false;
    setAuthStatus(status, '');
  }

  openButton.addEventListener('click', showResetForm);
  backButton.addEventListener('click', showLoginForm);

  resetForm.addEventListener('submit', async event => {
    event.preventDefault();
    const email = resetForm.elements.resetEmail.value.trim();
    if (!email) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    setAuthStatus(status, '');
    try {
      await auth.sendPasswordResetEmail(email);
      setAuthStatus(status, 'Check your email for the secure password-reset link and verification code.');
    } catch (error) {
      setAuthStatus(status, friendlyAuthError(error), true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Send reset email';
    }
  });
})();
