/**
 * Legacy admin auth — redirects to the main login/register pages.
 * Kept for backwards compatibility with old links.
 */
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authStatus = document.getElementById('authStatus');
const toggleToSignup = document.getElementById('toggleToSignup');
const toggleToLogin = document.getElementById('toggleToLogin');

if (!loginForm && !signupForm) {
  window.location.href = '../login.html';
}

toggleToSignup?.addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = '../register.html';
});

toggleToLogin?.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.hidden = false;
  signupForm.hidden = true;
});

loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  window.location.href = '../login.html';
});

signupForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  window.location.href = '../register.html';
});

auth.onAuthStateChanged(user => {
  if (user) window.location.href = 'dashboard.html';
});
