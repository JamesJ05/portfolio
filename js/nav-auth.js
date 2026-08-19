/**
 * Updates the landing page nav based on auth state.
 */
(function navAuth() {
  const authNav = document.getElementById('authNav');
  if (!authNav) return;

  auth.onAuthStateChanged(user => {
    if (user) {
      authNav.innerHTML = `
        <a href="admin/dashboard.html" class="btn btn-ghost nav-btn">Dashboard</a>
        <button type="button" class="btn btn-primary nav-btn" id="navLogoutBtn">Log out</button>
      `;
      document.getElementById('navLogoutBtn')?.addEventListener('click', () => auth.signOut());
    } else {
      authNav.innerHTML = `
        <a href="login.html" class="btn btn-ghost nav-btn">Log in</a>
        <a href="register.html" class="btn btn-primary nav-btn">Sign up</a>
      `;
    }
  });
})();
