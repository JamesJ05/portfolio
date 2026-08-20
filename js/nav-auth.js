/**
 * Updates the landing page nav based on auth state.
 */
(function navAuth() {
  const authNav = document.getElementById('authNav');
  const navUsername = document.getElementById('navUsername');
  const footerUsername = document.getElementById('footerUsername');
  if (!authNav) return;
  let unsubscribeProfile = null;

  function setBrandLabel(element, label) {
    if (!element) return;
    element.textContent = label;
    element.insertAdjacentHTML('beforeend', '<span class="dot">.</span>');
  }

  function renderSignedInNav(user, data, admin) {
    // Match the profile page's condition exactly so both views display the
    // same saved avatar, including profiles created before the current schema.
    const hasCustomAvatar = data.hasCustomAvatar && typeof data.photoURL === 'string' && data.photoURL;
    const avatar = hasCustomAvatar
      ? `<img class="nav-profile-image" src="${data.photoURL}" alt="" />`
      : '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.1 0-7 2-7 4.5V20h14v-1.5c0-2.5-2.9-4.5-7-4.5Z"/></svg>';
    const name = data.displayName || data.username || user.displayName || user.email?.split('@')[0] || 'Profile';

    setBrandLabel(navUsername, name);
    setBrandLabel(footerUsername, name);
    authNav.innerHTML = `${admin ? '<a href="admin/dashboard.html" class="btn btn-ghost nav-btn">Dashboard</a>' : ''}
      <a href="profile.html" class="btn btn-ghost nav-profile" aria-label="Open profile" title="Profile">
        ${avatar}
      </a>
      <button type="button" class="btn btn-primary nav-btn" id="navLogoutBtn">Log out</button>`;
    document.getElementById('navLogoutBtn')?.addEventListener('click', () => auth.signOut());
  }

  auth.onAuthStateChanged(async user => {
    unsubscribeProfile?.();
    unsubscribeProfile = null;

    if (user) {
      const admin = await isAdmin(user.uid).catch(() => false);
      unsubscribeProfile = db.collection('users').doc(user.uid).onSnapshot(
        snapshot => renderSignedInNav(user, snapshot.data() || {}, admin),
        () => renderSignedInNav(user, {}, admin)
      );
    } else {
      setBrandLabel(navUsername, 'Aspiring IT Professional');
      setBrandLabel(footerUsername, 'Guest');
      authNav.innerHTML = `
        <a href="https://jamesj05.github.io/portfolio/login.html" class="btn btn-ghost nav-btn">Log in</a>
        <a href="https://jamesj05.github.io/portfolio/register.html" class="btn btn-primary nav-btn">Sign up</a>
      `;
    }
  });
})();
