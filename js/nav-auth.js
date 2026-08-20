/**
 * Updates the landing page nav based on auth state.
 */
(function navAuth() {
  const authNav = document.getElementById('authNav');
  const navUsername = document.getElementById('navUsername');
  const footerUsername = document.getElementById('footerUsername');
  if (!authNav) return;

  function setBrandLabel(element, label) {
    if (!element) return;
    element.textContent = label;
    element.insertAdjacentHTML('beforeend', '<span class="dot">.</span>');
  }

  auth.onAuthStateChanged(async user => {
    if (user) {
      const profile = await db.collection('users').doc(user.uid).get().catch(() => null);
      const data = profile?.data() || {};
      const name = data.username || user.displayName || user.email?.split('@')[0] || 'Profile';
      setBrandLabel(navUsername, name);
      setBrandLabel(footerUsername, name);
      const avatar = data.photoURL || user.photoURL;
      const admin = await isAdmin(user.uid).catch(() => false);
      authNav.innerHTML = `${admin ? '<a href="admin/dashboard.html" class="btn btn-ghost nav-btn">Dashboard</a>' : ''}
        <a href="profile.html" class="btn btn-ghost nav-btn nav-profile">${avatar ? `<img class="nav-avatar" src="${avatar}" alt="">` : ''}<span>${name}</span></a>
        <button type="button" class="btn btn-primary nav-btn" id="navLogoutBtn">Log out</button>`;
      document.getElementById('navLogoutBtn')?.addEventListener('click', () => auth.signOut());
    } else {
      setBrandLabel(navUsername, 'Aspiring IT Professional');
      setBrandLabel(footerUsername, 'Guest');
      authNav.innerHTML = `
        <a href="login.html" class="btn btn-ghost nav-btn">Log in</a>
        <a href="register.html" class="btn btn-primary nav-btn">Sign up</a>
      `;
    }
  });
})();
